// Matriz de treinamentos: define quais cursos cada função exige e mostra quem está em dia, vencido ou sem o curso.
import { useMemo, useState } from 'react'
import { Download, Plus, X } from 'lucide-react'
import { Campo, Link, PageHead, Vazio, toast } from '../components/ui'
import { CURSOS } from '../lib/catalogos'
import { daEmpresaAtiva, db, useDB } from '../lib/store'
import type { DB } from '../lib/types'
import { baixarArquivo, fmtData, gerarCSV, hoje, normalizar, situacao } from '../lib/utils'

export type StatusMatriz = 'ok' | 'avencer' | 'vencido' | 'falta'

/** Cursos exigidos para uma função (comparação sem acentos/maiúsculas). */
export function cursosDaFuncao(d: DB, funcao: string) {
  const f = normalizar(funcao.trim())
  return d.requisitos.find((r) => normalizar(r.funcao.trim()) === f)?.cursos ?? []
}

/** Situação de um colaborador em um curso exigido (considera o registro mais recente). */
export function statusCurso(d: DB, colaboradorId: string, curso: string): { st: StatusMatriz; validade?: string } {
  const t = d.treinamentos
    .filter((x) => x.colaboradorId === colaboradorId && normalizar(x.curso) === normalizar(curso))
    .sort((a, b) => b.data.localeCompare(a.data))[0]
  if (!t) return { st: 'falta' }
  const s = situacao(t.validade, d.config.alertaDias)
  return { st: s === 'sem' ? 'ok' : s, validade: t.validade }
}

/** Total de cursos faltando ou vencidos (para o contador do menu e do painel). */
export function pendenciasMatriz(d: DB) {
  let n = 0
  for (const c of daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status === 'Ativo')) {
    for (const curso of cursosDaFuncao(d, c.funcao)) {
      const st = statusCurso(d, c.id, curso).st
      if (st === 'falta' || st === 'vencido') n++
    }
  }
  return n
}

const ROTULO: Record<StatusMatriz, string> = { ok: 'Em dia', avencer: 'A vencer', vencido: 'Vencido', falta: 'Falta' }
const CLASSE: Record<StatusMatriz, string> = { ok: 'ok', avencer: 'avencer', vencido: 'vencido', falta: 'vencido' }

export default function Matriz() {
  const [aba, setAba] = useState(0)
  return (
    <>
      <PageHead titulo="Matriz de treinamentos" sub="Defina os cursos obrigatórios de cada função e veja quem está em dia, vencido ou ainda sem o curso." />
      <div className="tabs" role="tablist">
        {['Situação por colaborador', 'Cursos exigidos por função'].map((t, i) => (
          <button key={t} role="tab" aria-selected={aba === i} className={'tab' + (aba === i ? ' ativo' : '')} onClick={() => setAba(i)}>{t}</button>
        ))}
      </div>
      {aba === 0 ? <Situacao irParaRequisitos={() => setAba(1)} /> : <Requisitos />}
    </>
  )
}

function Situacao({ irParaRequisitos }: { irParaRequisitos: () => void }) {
  const d = useDB()
  const [soPend, setSoPend] = useState(false)
  const colabs = daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado').sort((a, b) => a.nome.localeCompare(b.nome))

  const linhas = useMemo(
    () =>
      colabs.map((c) => {
        const cursos = cursosDaFuncao(d, c.funcao)
        return { c, itens: cursos.map((curso) => ({ curso, ...statusCurso(d, c.id, curso) })) }
      }),
    [d, colabs],
  )
  const cursosUsados = [...new Set(linhas.flatMap((l) => l.itens.map((i) => i.curso)))].sort()
  const visiveis = linhas.filter((l) => !soPend || l.itens.some((i) => i.st !== 'ok'))
  const semRequisito = [...new Set(linhas.filter((l) => !l.itens.length).map((l) => l.c.funcao))]
  const totais = linhas.flatMap((l) => l.itens).reduce((acc, i) => ({ ...acc, [i.st]: (acc[i.st] ?? 0) + 1 }), {} as Record<string, number>)

  function exportar() {
    const csv = gerarCSV(
      ['Colaborador', 'Função', ...cursosUsados],
      visiveis.map((l) => [l.c.nome, l.c.funcao, ...cursosUsados.map((curso) => {
        const it = l.itens.find((i) => i.curso === curso)
        return it ? `${ROTULO[it.st]}${it.validade ? ' (' + fmtData(it.validade) + ')' : ''}` : '-'
      })]),
    )
    baixarArquivo(`matriz-treinamentos-${hoje()}.csv`, csv, 'text/csv')
  }

  if (!d.requisitos.length) {
    return (
      <div className="card">
        <Vazio texto="Nenhuma função tem cursos obrigatórios definidos ainda.">
          <button className="btn btn-primary" onClick={irParaRequisitos}>Definir cursos por função</button>
        </Vazio>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><div className="rotulo">Em dia</div><div className="valor" style={{ color: 'var(--ok)' }}>{totais.ok ?? 0}</div></div>
        <div className="card stat"><div className="rotulo">A vencer</div><div className="valor" style={{ color: 'var(--warn)' }}>{totais.avencer ?? 0}</div></div>
        <div className="card stat"><div className="rotulo">Vencidos</div><div className="valor" style={{ color: 'var(--danger)' }}>{totais.vencido ?? 0}</div></div>
        <div className="card stat"><div className="rotulo">Sem o curso</div><div className="valor" style={{ color: 'var(--danger)' }}>{totais.falta ?? 0}</div></div>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="chips">
            <button className={'chip' + (!soPend ? ' ativo' : '')} onClick={() => setSoPend(false)}>Todos</button>
            <button className={'chip' + (soPend ? ' ativo' : '')} onClick={() => setSoPend(true)}>Só com pendência</button>
          </div>
          <span style={{ flex: 1 }} />
          <Link to="/app/treinamentos" className="btn btn-sm">Registrar treinamento</Link>
          <button className="btn btn-sm" onClick={exportar}><Download size={14} /> CSV</button>
        </div>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Colaborador</th>
                {cursosUsados.map((c) => <th key={c} style={{ whiteSpace: 'normal', minWidth: 110 }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {visiveis.map(({ c, itens }) => (
                <tr key={c.id}>
                  <td><strong>{c.nome}</strong><span className="sub">{c.funcao}</span></td>
                  {cursosUsados.map((curso) => {
                    const it = itens.find((i) => i.curso === curso)
                    if (!it) return <td key={curso} style={{ color: 'var(--muted)' }}>—</td>
                    return (
                      <td key={curso}>
                        <span className={'badge ' + CLASSE[it.st]} style={it.st === 'falta' ? { background: 'transparent', border: '1px dashed var(--danger)' } : undefined}>{ROTULO[it.st]}</span>
                        {it.validade && <span className="sub">{fmtData(it.validade)}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {semRequisito.length > 0 && (
          <div className="rodape-tabela">
            Funções sem cursos definidos: {semRequisito.join(', ')}.{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); irParaRequisitos() }}>Definir agora</a>
          </div>
        )}
      </div>
    </>
  )
}

function Requisitos() {
  const d = useDB()
  const [novaFuncao, setNovaFuncao] = useState('')
  const funcoesColabs = [...new Set(d.colaboradores.map((c) => c.funcao.trim()).filter(Boolean))]
  const definidas = new Set(d.requisitos.map((r) => normalizar(r.funcao)))
  const sugestoes = funcoesColabs.filter((f) => !definidas.has(normalizar(f)))
  const opcoesCursos = [...new Set([...CURSOS.map((c) => c.nome), ...d.treinamentos.map((t) => t.curso)])].sort()

  function adicionar(funcao: string) {
    const f = funcao.trim()
    if (!f) return
    if (definidas.has(normalizar(f))) return alert('Essa função já está na lista.')
    db.adicionar('requisitos', { funcao: f, cursos: [] })
    setNovaFuncao('')
    toast('Função adicionada')
  }

  return (
    <>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Campo label="Adicionar função">
              <input className="input" list="dl-funcoes" value={novaFuncao} onChange={(e) => setNovaFuncao(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && adicionar(novaFuncao)} placeholder="Ex.: Eletricista" />
              <datalist id="dl-funcoes">{sugestoes.map((f) => <option key={f} value={f} />)}</datalist>
            </Campo>
          </div>
          <button className="btn btn-primary" onClick={() => adicionar(novaFuncao)}><Plus size={16} /> Adicionar</button>
        </div>
        {sugestoes.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Funções dos colaboradores ainda sem definição:</span>
            {sugestoes.map((f) => <button key={f} className="chip" onClick={() => adicionar(f)}>+ {f}</button>)}
          </div>
        )}
      </div>

      {d.requisitos.length === 0 ? (
        <div className="card"><Vazio texto="Adicione uma função para definir os cursos obrigatórios." /></div>
      ) : (
        <div className="grid grid-2">
          {[...d.requisitos].sort((a, b) => a.funcao.localeCompare(b.funcao)).map((r) => {
            const qtd = d.colaboradores.filter((c) => c.status !== 'Desligado' && normalizar(c.funcao.trim()) === normalizar(r.funcao.trim())).length
            return (
              <div className="card card-pad" key={r.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <strong style={{ fontSize: 15 }}>{r.funcao}</strong>
                  <span className="badge">{qtd} colaborador(es)</span>
                  <button className="btn btn-icon btn-danger" style={{ marginLeft: 'auto' }} aria-label="Remover função" onClick={() => confirm(`Remover os requisitos da função "${r.funcao}"?`) && db.remover('requisitos', r.id)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="chips">
                  {opcoesCursos.map((curso) => {
                    const on = r.cursos.includes(curso)
                    return (
                      <button
                        key={curso}
                        className={'chip' + (on ? ' ativo' : '')}
                        aria-pressed={on}
                        onClick={() => db.atualizar('requisitos', r.id, { cursos: on ? r.cursos.filter((c) => c !== curso) : [...r.cursos, curso] })}
                      >
                        {curso}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
