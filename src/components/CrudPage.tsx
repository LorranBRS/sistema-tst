// Página genérica de cadastro: lista com busca, filtros, exportação CSV e formulário em modal.
// Cada módulo (colaboradores, treinamentos, ASOs...) só descreve campos e colunas.
import { useMemo, useState, type ReactNode } from 'react'
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { ColKey, DB } from '../lib/types'
import { db, daEmpresaAtiva, useDB } from '../lib/store'
import { baixarArquivo, gerarCSV, hoje, normalizar } from '../lib/utils'
import { Campo, Modal, PageHead, Vazio, toast } from './ui'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Reg = { id: string; [k: string]: any }

export interface CampoDef {
  nome: string
  rotulo: string
  tipo: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'ref' | 'datalist'
  opcoes?: string[] | ((d: DB) => string[])
  ref?: 'empresas' | 'colaboradores' | 'epis'
  obrigatorio?: boolean
  full?: boolean
  ajuda?: string
  placeholder?: string
}

export interface ColunaDef {
  rotulo: string
  texto: (r: Reg, d: DB) => string
  render?: (r: Reg, d: DB) => ReactNode
  esconderMobile?: boolean
}

export interface FiltroDef {
  rotulo: string
  teste: (r: Reg, d: DB) => boolean
}

export interface CrudConfig {
  colecao: ColKey
  titulo: string
  sub: string
  singular: string
  campos: CampoDef[]
  colunas: ColunaDef[]
  /** 'empresa' = registro tem empresaId; 'colaborador' = herda do colaborador; ausente = global */
  escopo?: 'empresa' | 'colaborador'
  filtros?: FiltroDef[]
  padroes?: (d: DB) => Reg | Record<string, unknown>
  /** recalcula campos dependentes quando um campo muda */
  derivar?: (valores: Reg, campoAlterado: string, d: DB) => Partial<Reg>
  aoCriar?: (r: Reg) => void
  ordenar?: (a: Reg, b: Reg) => number
  acoesExtras?: (r: Reg, d: DB) => ReactNode
  cabecalhoExtra?: ReactNode
}

function rotuloRef(d: DB, col: 'empresas' | 'colaboradores' | 'epis', r: Reg) {
  if (col === 'epis') return `${r.nome} (CA ${r.ca})`
  if (col === 'colaboradores') return `${r.nome}${r.funcao ? ' – ' + r.funcao : ''}`
  return r.nome
}

export function CrudPage({ cfg }: { cfg: CrudConfig }) {
  const d = useDB()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState(0)
  const [editando, setEditando] = useState<Reg | null>(null)

  const todos = d[cfg.colecao] as unknown as Reg[]
  const lista = useMemo(() => {
    let l = cfg.escopo ? daEmpresaAtiva(d, todos) : todos
    if (cfg.filtros && filtro > 0) l = l.filter((r) => cfg.filtros![filtro - 1].teste(r, d))
    if (busca.trim()) {
      const q = normalizar(busca.trim())
      l = l.filter((r) => normalizar(cfg.colunas.map((c) => c.texto(r, d)).join(' ')).includes(q))
    }
    return cfg.ordenar ? [...l].sort(cfg.ordenar) : l
  }, [d, todos, busca, filtro, cfg])

  function novo() {
    const base: Reg = { id: '' }
    for (const c of cfg.campos) base[c.nome] = c.tipo === 'number' ? 0 : c.tipo === 'date' && c.nome === 'data' ? hoje() : ''
    if (cfg.escopo === 'empresa' && d.config.empresaAtiva) base.empresaId = d.config.empresaAtiva
    Object.assign(base, cfg.padroes?.(d) ?? {})
    setEditando(base)
  }

  function exportar() {
    const csv = gerarCSV(cfg.colunas.map((c) => c.rotulo), lista.map((r) => cfg.colunas.map((c) => c.texto(r, d))))
    baixarArquivo(`${cfg.colecao}-${hoje()}.csv`, csv, 'text/csv')
  }

  function excluir(r: Reg) {
    if (confirm(`Excluir este registro de ${cfg.singular.toLowerCase()}? Essa ação não pode ser desfeita.`)) {
      db.remover(cfg.colecao, r.id)
      toast('Registro excluído')
    }
  }

  return (
    <>
      <PageHead titulo={cfg.titulo} sub={cfg.sub}>
        <button className="btn" onClick={exportar} disabled={!lista.length}>
          <Download size={16} /> Exportar CSV
        </button>
        <button className="btn btn-primary" onClick={novo}>
          <Plus size={16} /> Novo {cfg.singular.toLowerCase()}
        </button>
      </PageHead>
      {cfg.cabecalhoExtra}
      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input className="input" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          {cfg.filtros && (
            <div className="chips">
              {['Todos', ...cfg.filtros.map((f) => f.rotulo)].map((r, i) => (
                <button key={r} className={'chip' + (filtro === i ? ' ativo' : '')} onClick={() => setFiltro(i)}>
                  {r}
                  {i > 0 && ` (${(cfg.escopo ? daEmpresaAtiva(d, todos) : todos).filter((x) => cfg.filtros![i - 1].teste(x, d)).length})`}
                </button>
              ))}
            </div>
          )}
        </div>
        {lista.length === 0 ? (
          <Vazio texto={todos.length ? 'Nenhum registro encontrado com esses filtros.' : `Nenhum ${cfg.singular.toLowerCase()} cadastrado ainda.`}>
            {!todos.length && (
              <button className="btn btn-primary" onClick={novo}>
                <Plus size={16} /> Cadastrar
              </button>
            )}
          </Vazio>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  {cfg.colunas.map((c) => (
                    <th key={c.rotulo} className={c.esconderMobile ? 'esconde-mobile' : ''}>
                      {c.rotulo}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id}>
                    {cfg.colunas.map((c) => (
                      <td key={c.rotulo} className={c.esconderMobile ? 'esconde-mobile' : ''}>
                        {c.render ? c.render(r, d) : c.texto(r, d) || '—'}
                      </td>
                    ))}
                    <td>
                      <div className="acoes-linha">
                        {cfg.acoesExtras?.(r, d)}
                        <button className="btn btn-icon" title="Editar" aria-label="Editar" onClick={() => setEditando({ ...r })}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn btn-icon btn-danger" title="Excluir" aria-label="Excluir" onClick={() => excluir(r)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {lista.length > 0 && <div className="rodape-tabela">{lista.length} registro(s)</div>}
      </div>
      {editando && <Formulario cfg={cfg} inicial={editando} onClose={() => setEditando(null)} />}
    </>
  )
}

function Formulario({ cfg, inicial, onClose }: { cfg: CrudConfig; inicial: Reg; onClose: () => void }) {
  const d = useDB()
  const [v, setV] = useState<Reg>(inicial)
  const [erro, setErro] = useState('')
  const novo = !inicial.id

  function mudar(nome: string, valor: unknown) {
    setV((atual) => {
      const prox = { ...atual, [nome]: valor }
      return { ...prox, ...(cfg.derivar?.(prox, nome, d) ?? {}) }
    })
  }

  function salvar() {
    const faltando = cfg.campos.filter((c) => c.obrigatorio && (v[c.nome] === '' || v[c.nome] === undefined))
    if (faltando.length) {
      setErro('Preencha: ' + faltando.map((c) => c.rotulo).join(', '))
      return
    }
    if (novo) {
      const { id: _id, ...dados } = v
      const id = db.adicionar(cfg.colecao, dados as never)
      cfg.aoCriar?.({ ...v, id })
      toast(`${cfg.singular} cadastrado(a)`)
    } else {
      db.atualizar(cfg.colecao, v.id, v as never)
      toast('Alterações salvas')
    }
    onClose()
  }

  const colabs = daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado' || c.id === v.colaboradorId)

  return (
    <Modal
      titulo={(novo ? 'Novo ' : 'Editar ') + cfg.singular.toLowerCase()}
      onClose={onClose}
      rodape={
        <>
          {erro && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{erro}</span>}
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={salvar}>
            Salvar
          </button>
        </>
      }
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault()
          salvar()
        }}
      >
        {cfg.campos.map((c) => {
          const rot = c.rotulo + (c.obrigatorio ? ' *' : '')
          const val = v[c.nome] ?? ''
          let input: ReactNode
          if (c.tipo === 'textarea') {
            input = <textarea className="input" value={val} placeholder={c.placeholder} onChange={(e) => mudar(c.nome, e.target.value)} />
          } else if (c.tipo === 'select') {
            const ops = typeof c.opcoes === 'function' ? c.opcoes(d) : c.opcoes ?? []
            input = (
              <select className="input" value={val} onChange={(e) => mudar(c.nome, e.target.value)}>
                <option value="">Selecione...</option>
                {ops.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )
          } else if (c.tipo === 'datalist') {
            const ops = typeof c.opcoes === 'function' ? c.opcoes(d) : c.opcoes ?? []
            input = (
              <>
                <input className="input" list={'dl-' + c.nome} value={val} placeholder={c.placeholder} onChange={(e) => mudar(c.nome, e.target.value)} />
                <datalist id={'dl-' + c.nome}>
                  {ops.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </>
            )
          } else if (c.tipo === 'ref') {
            const fonte = (c.ref === 'colaboradores' ? colabs : d[c.ref!]) as unknown as Reg[]
            input = (
              <select className="input" value={val} onChange={(e) => mudar(c.nome, e.target.value)}>
                <option value="">Selecione...</option>
                {fonte.map((r) => (
                  <option key={r.id} value={r.id}>
                    {rotuloRef(d, c.ref!, r)}
                  </option>
                ))}
              </select>
            )
          } else {
            input = (
              <input
                className="input"
                type={c.tipo}
                value={val}
                placeholder={c.placeholder}
                step={c.tipo === 'number' ? 'any' : undefined}
                onChange={(e) => mudar(c.nome, c.tipo === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
              />
            )
          }
          return (
            <Campo key={c.nome} label={rot} full={c.full || c.tipo === 'textarea'} ajuda={c.ajuda}>
              {input}
            </Campo>
          )
        })}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
