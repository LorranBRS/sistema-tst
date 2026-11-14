import { useState } from 'react'
import { ArrowLeft, CheckCheck, ClipboardList, Copy, ListChecks, ListPlus, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { BadgeStatus, CabecalhoDoc, Campo, Link, Modal, PageHead, Vazio, navegar, toast } from '../components/ui'
import { MODELOS_INSPECAO, type ModeloInspecao } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { DB, Inspecao, ModeloProprio, Resposta } from '../lib/types'
import { addDias, fmtData, hoje } from '../lib/utils'

export function resumo(i: Inspecao) {
  const c = i.itens.filter((x) => x.resposta === 'C').length
  const nc = i.itens.filter((x) => x.resposta === 'NC').length
  const na = i.itens.filter((x) => x.resposta === 'NA').length
  const respondidos = c + nc + na
  return { c, nc, na, respondidos, total: i.itens.length, conf: c + nc ? Math.round((c / (c + nc)) * 100) : null }
}

/** Modelos padrão + checklists criados pelo usuário. */
export function todosModelos(d: DB): (ModeloInspecao & { proprio?: boolean })[] {
  return [...MODELOS_INSPECAO, ...d.modelos.map((m) => ({ ...m, proprio: true }))]
}

export default function Inspecoes() {
  const d = useDB()
  const [nova, setNova] = useState(false)
  const [gerenciar, setGerenciar] = useState(false)
  const lista = [...daEmpresaAtiva(d, d.inspecoes)].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <>
      <PageHead titulo="Inspeções" sub="Checklists de campo por NR. Não conformidades viram ações no plano de ação com um clique.">
        <button className="btn" onClick={() => setGerenciar(true)}>
          <ListChecks size={16} /> Meus checklists
        </button>
        <button className="btn btn-primary" onClick={() => setNova(true)}>
          <Plus size={16} /> Nova inspeção
        </button>
      </PageHead>

      <div className="card">
        {lista.length === 0 ? (
          <Vazio texto="Nenhuma inspeção registrada." />
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Checklist</th>
                  <th className="esconde-mobile">Empresa</th>
                  <th>Resultado</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => {
                  const r = resumo(i)
                  return (
                    <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => navegar('/app/inspecoes/' + i.id)}>
                      <td>{fmtData(i.data)}</td>
                      <td>
                        <strong>{i.titulo}</strong>
                        <span className="sub">{i.local}</span>
                      </td>
                      <td className="esconde-mobile">{nomes.empresa(d, i.empresaId)}</td>
                      <td>
                        {r.conf === null ? '—' : <span className={'badge ' + (r.conf >= 90 ? 'ok' : r.conf >= 70 ? 'avencer' : 'vencido')}>{r.conf}% conforme</span>}
                        <span className="sub">
                          {r.respondidos}/{r.total} itens · {r.nc} NC
                        </span>
                      </td>
                      <td>
                        <BadgeStatus valor={i.status} />
                      </td>
                      <td>
                        <div className="acoes-linha">
                          <button
                            className="btn btn-icon btn-danger"
                            aria-label="Excluir"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Excluir esta inspeção?')) db.remover('inspecoes', i.id)
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {nova && <NovaInspecao onClose={() => setNova(false)} />}
      {gerenciar && <GerenciarModelos onClose={() => setGerenciar(false)} />}
    </>
  )
}

function NovaInspecao({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const modelos = todosModelos(d)
  const [modelo, setModelo] = useState(modelos[0].id)
  const [empresaId, setEmpresa] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  const [local, setLocal] = useState('')
  const [data, setData] = useState(hoje())
  const [erro, setErro] = useState('')

  function criar() {
    if (!empresaId) return setErro('Cadastre ou selecione uma empresa.')
    const m = modelos.find((x) => x.id === modelo)!
    const id = db.adicionar('inspecoes', {
      empresaId,
      modelo,
      titulo: m.nome,
      local,
      data,
      responsavel: d.config.tecnico,
      itens: m.itens.map((texto) => ({ texto, resposta: '' as Resposta, obs: '' })),
      status: 'Em andamento',
    })
    onClose()
    navegar('/app/inspecoes/' + id)
  }

  return (
    <Modal
      titulo="Nova inspeção"
      onClose={onClose}
      rodape={
        <>
          {erro && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{erro}</span>}
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={criar}>
            Iniciar checklist
          </button>
        </>
      }
    >
      <div className="field" style={{ marginBottom: 14 }}>
        <label>Modelo de checklist</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {modelos.map((m) => (
            <button
              key={m.id}
              type="button"
              className="card"
              onClick={() => setModelo(m.id)}
              style={{ textAlign: 'left', padding: 12, cursor: 'pointer', borderColor: modelo === m.id ? 'var(--primary)' : undefined, outline: modelo === m.id ? '2px solid var(--primary-soft)' : undefined }}
            >
              <span className="badge info">{m.nr || 'Checklist'}</span>
              {m.proprio && <span className="badge ok" style={{ marginLeft: 4 }}>Próprio</span>}
              <div style={{ fontWeight: 600, marginTop: 6, fontSize: 14 }}>{m.nome}</div>
              <div className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {m.itens.length} itens
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
        <Campo label="Empresa *">
          <select className="input" value={empresaId} onChange={(e) => setEmpresa(e.target.value)}>
            <option value="">Selecione...</option>
            {d.empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Data">
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo label="Local / setor inspecionado" full>
          <input className="input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Galpão 2, linha de prensas" />
        </Campo>
      </div>
    </Modal>
  )
}

export function ExecutarInspecao({ id }: { id: string }) {
  const d = useDB()
  const insp = d.inspecoes.find((i) => i.id === id)
  if (!insp) return <Vazio texto="Inspeção não encontrada."><Link to="/app/inspecoes">Voltar</Link></Vazio>
  const r = resumo(insp)
  const empresa = d.empresas.find((e) => e.id === insp.empresaId)

  const responder = (idx: number, patch: Partial<Inspecao['itens'][number]>) =>
    db.atualizar('inspecoes', insp.id, { itens: insp.itens.map((it, i) => (i === idx ? { ...it, ...patch } : it)) })

  function gerarAcoes() {
    const ncs = insp!.itens.filter((x) => x.resposta === 'NC')
    for (const it of ncs) {
      db.adicionar('acoes', {
        empresaId: insp!.empresaId,
        oque: `Corrigir: ${it.texto}`,
        porque: it.obs || 'Não conformidade identificada em inspeção',
        onde: insp!.local,
        quem: '',
        quando: addDias(hoje(), 15),
        como: '',
        quanto: '',
        prioridade: 'Média',
        status: 'Aberta',
        origem: `Inspeção ${insp!.titulo} (${fmtData(insp!.data)})`,
      })
    }
    db.atualizar('inspecoes', insp!.id, { acoesGeradas: true })
    toast(`${ncs.length} ação(ões) criada(s) no plano de ação`)
  }

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/inspecoes">
          <ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Inspeções
        </Link>
      </div>
      <div className="so-impressao"><CabecalhoDoc empresa={empresa} /></div>
      <PageHead titulo={insp.titulo} sub={`${empresa?.nome ?? '—'} · ${insp.local || 'Local não informado'} · ${fmtData(insp.data)}`}>
        <button className="btn" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / PDF
        </button>
        {r.nc > 0 && (
          <button className="btn" onClick={gerarAcoes} disabled={insp.acoesGeradas}>
            <ListPlus size={16} /> {insp.acoesGeradas ? 'Ações já geradas' : `Gerar ${r.nc} ação(ões)`}
          </button>
        )}
        {insp.status === 'Em andamento' ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (r.respondidos < r.total && !confirm(`Ainda há ${r.total - r.respondidos} item(ns) sem resposta. Concluir mesmo assim?`)) return
              db.atualizar('inspecoes', insp.id, { status: 'Concluída' })
              toast('Inspeção concluída')
            }}
          >
            <CheckCheck size={16} /> Concluir
          </button>
        ) : (
          <button className="btn" onClick={() => db.atualizar('inspecoes', insp.id, { status: 'Em andamento' })}>
            Reabrir
          </button>
        )}
      </PageHead>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="rotulo">Progresso</div>
          <div className="valor">
            {r.respondidos}/{r.total}
          </div>
          <div className="progresso">
            <div style={{ width: `${(r.respondidos / r.total) * 100}%` }} />
          </div>
        </div>
        <div className="card stat">
          <div className="rotulo">Conformidade</div>
          <div className="valor" style={{ color: r.conf === null ? undefined : r.conf >= 90 ? 'var(--ok)' : r.conf >= 70 ? 'var(--warn)' : 'var(--danger)' }}>
            {r.conf === null ? '—' : r.conf + '%'}
          </div>
        </div>
        <div className="card stat">
          <div className="rotulo">Não conformes</div>
          <div className="valor" style={{ color: r.nc ? 'var(--danger)' : undefined }}>
            {r.nc}
          </div>
        </div>
        <div className="card stat">
          <div className="rotulo">Status</div>
          <div>
            <BadgeStatus valor={insp.status} />
          </div>
          <div className="detalhe">Resp.: {insp.responsavel}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <ClipboardList size={17} />
          <h3>Itens verificados</h3>
          <span className="sub" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            C = conforme · NC = não conforme · NA = não se aplica
          </span>
        </div>
        {insp.itens.map((it, i) => (
          <div className="item-insp" key={i}>
            <span className="n">{i + 1}</span>
            <div>
              <div style={{ fontWeight: 500 }}>{it.texto}</div>
              {(it.resposta === 'NC' || it.obs) && (
                <input className="input" placeholder="Observação / evidência da não conformidade" value={it.obs} onChange={(e) => responder(i, { obs: e.target.value })} />
              )}
            </div>
            <div className="resp" role="group" aria-label={`Resposta do item ${i + 1}`}>
              {(['C', 'NC', 'NA'] as const).map((op) => (
                <button key={op} className={op + (it.resposta === op ? ' on' : '')} onClick={() => responder(i, { resposta: it.resposta === op ? '' : op })} aria-pressed={it.resposta === op}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="so-impressao" style={{ marginTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, textAlign: 'center', fontSize: 13 }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: 6 }}>{insp.responsavel}<br />Responsável pela inspeção</div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 6 }}>{empresa?.responsavel || 'Responsável da área'}<br />Ciente</div>
        </div>
      </div>
    </>
  )
}

/* ---------- Checklists próprios ---------- */
function GerenciarModelos({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const [editando, setEditando] = useState<ModeloProprio | null>(null)

  function duplicar(m: ModeloInspecao) {
    setEditando({ id: '', nome: m.nome + ' (cópia)', nr: m.nr, itens: [...m.itens] })
  }

  if (editando) return <EditarModelo inicial={editando} onClose={() => setEditando(null)} />

  return (
    <Modal titulo="Meus checklists" onClose={onClose} largura={760} rodape={
      <>
        <button className="btn" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={() => setEditando({ id: '', nome: '', nr: '', itens: [] })}><Plus size={16} /> Criar checklist</button>
      </>
    }>
      <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 14 }}>
        Crie checklists com os itens da sua rotina ou faça uma cópia de um modelo padrão para adaptar. Eles aparecem na hora de iniciar uma nova inspeção.
      </p>
      <h4 style={{ margin: '14px 0 8px' }}>Criados por você</h4>
      {d.modelos.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum checklist próprio ainda.</p>
      ) : (
        <ul className="lista card">
          {d.modelos.map((m) => (
            <li key={m.id}>
              <div style={{ minWidth: 0 }}>
                <div className="titulo">{m.nome}</div>
                <div className="sub">{m.nr ? m.nr + ' · ' : ''}{m.itens.length} itens</div>
              </div>
              <div className="dir" style={{ display: 'flex', gap: 2 }}>
                <button className="btn btn-icon" aria-label="Editar" title="Editar" onClick={() => setEditando({ ...m, itens: [...m.itens] })}><Pencil size={16} /></button>
                <button className="btn btn-icon btn-danger" aria-label="Excluir" title="Excluir" onClick={() => confirm(`Excluir o checklist "${m.nome}"? As inspeções já feitas com ele não são afetadas.`) && db.remover('modelos', m.id)}><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h4 style={{ margin: '18px 0 8px' }}>Modelos padrão</h4>
      <ul className="lista card">
        {MODELOS_INSPECAO.map((m) => (
          <li key={m.id}>
            <span className="badge info">{m.nr}</span>
            <div style={{ minWidth: 0 }}>
              <div className="titulo">{m.nome}</div>
              <div className="sub">{m.itens.length} itens</div>
            </div>
            <div className="dir">
              <button className="btn btn-sm" onClick={() => duplicar(m)}><Copy size={14} /> Copiar e editar</button>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

function EditarModelo({ inicial, onClose }: { inicial: ModeloProprio; onClose: () => void }) {
  const [nome, setNome] = useState(inicial.nome)
  const [nr, setNr] = useState(inicial.nr)
  const [texto, setTexto] = useState(inicial.itens.join('\n'))
  const [erro, setErro] = useState('')
  const itens = texto.split('\n').map((l) => l.trim()).filter(Boolean)

  function salvar() {
    if (!nome.trim()) return setErro('Dê um nome ao checklist.')
    if (!itens.length) return setErro('Inclua pelo menos um item.')
    if (inicial.id) db.atualizar('modelos', inicial.id, { nome: nome.trim(), nr: nr.trim(), itens })
    else db.adicionar('modelos', { nome: nome.trim(), nr: nr.trim(), itens })
    toast('Checklist salvo')
    onClose()
  }

  return (
    <Modal titulo={inicial.id ? 'Editar checklist' : 'Novo checklist'} onClose={onClose} rodape={
      <>
        {erro && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{erro}</span>}
        <button className="btn" onClick={onClose}>Voltar</button>
        <button className="btn btn-primary" onClick={salvar}>Salvar checklist</button>
      </>
    }>
      <div className="form-grid">
        <Campo label="Nome do checklist *"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Inspeção de andaimes" /></Campo>
        <Campo label="NR de referência"><input className="input" value={nr} onChange={(e) => setNr(e.target.value)} placeholder="Ex.: NR-18" /></Campo>
        <Campo label={`Itens (um por linha) – ${itens.length} item(ns)`} full>
          <textarea className="input" style={{ minHeight: 240 }} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={'Guarda-corpo instalado\nPiso completo e travado\nSapatas niveladas'} />
        </Campo>
      </div>
    </Modal>
  )
}
