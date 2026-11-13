import { useState } from 'react'
import { ArrowLeft, CheckCheck, ClipboardList, ListPlus, Plus, Printer, Trash2 } from 'lucide-react'
import { BadgeStatus, Campo, Link, Modal, PageHead, Vazio, navegar, toast } from '../components/ui'
import { MODELOS_INSPECAO } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { Inspecao, Resposta } from '../lib/types'
import { addDias, fmtData, hoje } from '../lib/utils'

export function resumo(i: Inspecao) {
  const c = i.itens.filter((x) => x.resposta === 'C').length
  const nc = i.itens.filter((x) => x.resposta === 'NC').length
  const na = i.itens.filter((x) => x.resposta === 'NA').length
  const respondidos = c + nc + na
  return { c, nc, na, respondidos, total: i.itens.length, conf: c + nc ? Math.round((c / (c + nc)) * 100) : null }
}

export default function Inspecoes() {
  const d = useDB()
  const [nova, setNova] = useState(false)
  const lista = [...daEmpresaAtiva(d, d.inspecoes)].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <>
      <PageHead titulo="Inspeções" sub="Checklists de campo por NR. Não conformidades viram ações no plano de ação com um clique.">
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
    </>
  )
}

function NovaInspecao({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const [modelo, setModelo] = useState(MODELOS_INSPECAO[0].id)
  const [empresaId, setEmpresa] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  const [local, setLocal] = useState('')
  const [data, setData] = useState(hoje())
  const [erro, setErro] = useState('')

  function criar() {
    if (!empresaId) return setErro('Cadastre ou selecione uma empresa.')
    const m = MODELOS_INSPECAO.find((x) => x.id === modelo)!
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
          {MODELOS_INSPECAO.map((m) => (
            <button
              key={m.id}
              type="button"
              className="card"
              onClick={() => setModelo(m.id)}
              style={{ textAlign: 'left', padding: 12, cursor: 'pointer', borderColor: modelo === m.id ? 'var(--primary)' : undefined, outline: modelo === m.id ? '2px solid var(--primary-soft)' : undefined }}
            >
              <span className="badge info">{m.nr}</span>
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
