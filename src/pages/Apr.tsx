import { ArrowLeft, Copy, Plus, Printer, Trash2 } from 'lucide-react'
import { BadgeStatus, Campo, Link, PageHead, Vazio, navegar, toast, CabecalhoDoc } from '../components/ui'
import { nivelRisco } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { Apr, EtapaApr } from '../lib/types'
import { fmtData, hoje } from '../lib/utils'

const etapaVazia = (): EtapaApr => ({ etapa: '', perigos: '', riscos: '', probabilidade: 1, severidade: 1, medidas: '', epis: '' })

function maiorRisco(a: Apr) {
  if (!a.etapas.length) return null
  return a.etapas.map((e) => nivelRisco(e.probabilidade, e.severidade)).sort((x, y) => y.valor - x.valor)[0]
}

export default function Aprs() {
  const d = useDB()
  const lista = [...daEmpresaAtiva(d, d.aprs)].sort((a, b) => b.data.localeCompare(a.data))

  function nova(base?: Apr) {
    const empresaId = base?.empresaId || d.config.empresaAtiva || d.empresas[0]?.id || ''
    if (!empresaId) return alert('Cadastre uma empresa antes de criar a APR.')
    const numero = 'APR-' + String(d.aprs.length + 1).padStart(3, '0')
    const id = db.adicionar('aprs', base
      ? { ...base, id: undefined, numero, data: hoje(), status: 'Rascunho', atividade: base.atividade + ' (cópia)' }
      : { empresaId, numero, atividade: '', local: '', data: hoje(), responsavel: d.config.tecnico, equipe: '', etapas: [etapaVazia()], status: 'Rascunho' })
    navegar('/app/apr/' + id)
  }

  return (
    <>
      <PageHead titulo="APR – Análise Preliminar de Risco" sub="Monte a análise por etapa da atividade com matriz de risco 5×5 e imprima para assinatura da equipe.">
        <button className="btn btn-primary" onClick={() => nova()}>
          <Plus size={16} /> Nova APR
        </button>
      </PageHead>
      <div className="card">
        {lista.length === 0 ? (
          <Vazio texto="Nenhuma APR cadastrada." />
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Atividade</th>
                  <th className="esconde-mobile">Empresa</th>
                  <th>Maior risco</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => {
                  const m = maiorRisco(a)
                  return (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navegar('/app/apr/' + a.id)}>
                      <td>
                        <strong>{a.numero}</strong>
                        <span className="sub">{fmtData(a.data)}</span>
                      </td>
                      <td>
                        {a.atividade || <em>Sem título</em>}
                        <span className="sub">{a.local}</span>
                      </td>
                      <td className="esconde-mobile">{nomes.empresa(d, a.empresaId)}</td>
                      <td>{m ? <span className={'risco ' + m.cls}>{m.nome} ({m.valor})</span> : '—'}</td>
                      <td>
                        <BadgeStatus valor={a.status} />
                      </td>
                      <td>
                        <div className="acoes-linha">
                          <button className="btn btn-icon" title="Duplicar" aria-label="Duplicar" onClick={(e) => { e.stopPropagation(); nova(a) }}>
                            <Copy size={16} />
                          </button>
                          <button className="btn btn-icon btn-danger" aria-label="Excluir" onClick={(e) => { e.stopPropagation(); if (confirm('Excluir esta APR?')) db.remover('aprs', a.id) }}>
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
    </>
  )
}

const ESCALA_P = ['1 – Rara', '2 – Improvável', '3 – Possível', '4 – Provável', '5 – Quase certa']
const ESCALA_S = ['1 – Insignificante', '2 – Leve', '3 – Moderada', '4 – Grave', '5 – Catastrófica']

export function EditarApr({ id }: { id: string }) {
  const d = useDB()
  const apr = d.aprs.find((a) => a.id === id)
  if (!apr) return <Vazio texto="APR não encontrada."><Link to="/app/apr">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === apr.empresaId)
  const set = (patch: Partial<Apr>) => db.atualizar('aprs', apr.id, patch)
  const setEtapa = (i: number, patch: Partial<EtapaApr>) => set({ etapas: apr.etapas.map((e, j) => (j === i ? { ...e, ...patch } : e)) })

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/apr">
          <ArrowLeft size={14} style={{ verticalAlign: -2 }} /> APRs
        </Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`${apr.numero} · ${apr.atividade || 'Nova APR'}`} sub="As alterações são salvas automaticamente.">
          <select className="input" style={{ width: 'auto' }} value={apr.status} onChange={(e) => { set({ status: e.target.value as Apr['status'] }); toast('Status atualizado') }} aria-label="Status">
            <option>Rascunho</option>
            <option>Aprovada</option>
            <option>Encerrada</option>
          </select>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir / PDF
          </button>
        </PageHead>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <Campo label="Atividade" full>
              <input className="input" value={apr.atividade} onChange={(e) => set({ atividade: e.target.value })} placeholder="Ex.: Troca de telhas no galpão 3" />
            </Campo>
            <Campo label="Empresa">
              <select className="input" value={apr.empresaId} onChange={(e) => set({ empresaId: e.target.value })}>
                {d.empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Local">
              <input className="input" value={apr.local} onChange={(e) => set({ local: e.target.value })} />
            </Campo>
            <Campo label="Data">
              <input className="input" type="date" value={apr.data} onChange={(e) => set({ data: e.target.value })} />
            </Campo>
            <Campo label="Responsável">
              <input className="input" value={apr.responsavel} onChange={(e) => set({ responsavel: e.target.value })} />
            </Campo>
            <Campo label="Equipe envolvida" full>
              <input className="input" value={apr.equipe} onChange={(e) => set({ equipe: e.target.value })} placeholder="Nomes separados por vírgula" />
            </Campo>
          </div>
        </div>

        <h3 style={{ margin: '4px 0 12px', fontSize: 16 }}>Etapas da atividade</h3>
        {apr.etapas.map((e, i) => {
          const n = nivelRisco(e.probabilidade, e.severidade)
          return (
            <div className="etapa-card" key={i}>
              <div className="topo">
                <strong>Etapa {i + 1}</strong>
                <span className={'risco ' + n.cls}>Risco {n.nome} ({n.valor})</span>
                <button className="btn btn-icon btn-danger" style={{ marginLeft: 'auto' }} aria-label="Remover etapa" onClick={() => set({ etapas: apr.etapas.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid">
                <Campo label="Etapa / passo" full>
                  <input className="input" value={e.etapa} onChange={(ev) => setEtapa(i, { etapa: ev.target.value })} />
                </Campo>
                <Campo label="Perigos">
                  <textarea className="input" style={{ minHeight: 60 }} value={e.perigos} onChange={(ev) => setEtapa(i, { perigos: ev.target.value })} />
                </Campo>
                <Campo label="Riscos / danos possíveis">
                  <textarea className="input" style={{ minHeight: 60 }} value={e.riscos} onChange={(ev) => setEtapa(i, { riscos: ev.target.value })} />
                </Campo>
                <Campo label="Probabilidade">
                  <select className="input" value={e.probabilidade} onChange={(ev) => setEtapa(i, { probabilidade: Number(ev.target.value) })}>
                    {ESCALA_P.map((t, k) => <option key={k} value={k + 1}>{t}</option>)}
                  </select>
                </Campo>
                <Campo label="Severidade">
                  <select className="input" value={e.severidade} onChange={(ev) => setEtapa(i, { severidade: Number(ev.target.value) })}>
                    {ESCALA_S.map((t, k) => <option key={k} value={k + 1}>{t}</option>)}
                  </select>
                </Campo>
                <Campo label="Medidas de controle">
                  <textarea className="input" style={{ minHeight: 60 }} value={e.medidas} onChange={(ev) => setEtapa(i, { medidas: ev.target.value })} />
                </Campo>
                <Campo label="EPIs necessários">
                  <textarea className="input" style={{ minHeight: 60 }} value={e.epis} onChange={(ev) => setEtapa(i, { epis: ev.target.value })} />
                </Campo>
              </div>
            </div>
          )
        })}
        <button className="btn" onClick={() => set({ etapas: [...apr.etapas, etapaVazia()] })}>
          <Plus size={16} /> Adicionar etapa
        </button>
        <p className="nota">Matriz: probabilidade × severidade. 1–4 baixo · 5–9 moderado · 10–14 alto · 15–25 crítico (não iniciar sem medidas adicionais).</p>
      </div>

      {/* Versão para impressão */}
      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>ANÁLISE PRELIMINAR DE RISCO – {apr.numero}</h2>
        <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj}</div>
        <div className="info">
          <div><b>Atividade:</b> {apr.atividade}</div>
          <div><b>Local:</b> {apr.local}</div>
          <div><b>Data:</b> {fmtData(apr.data)}</div>
          <div><b>Responsável:</b> {apr.responsavel}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>Equipe:</b> {apr.equipe}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Etapa</th><th>Perigos</th><th>Riscos</th><th>P×S</th><th>Medidas de controle</th><th>EPIs</th>
            </tr>
          </thead>
          <tbody>
            {apr.etapas.map((e, i) => {
              const n = nivelRisco(e.probabilidade, e.severidade)
              return (
                <tr key={i}>
                  <td>{i + 1}</td><td>{e.etapa}</td><td>{e.perigos}</td><td>{e.riscos}</td>
                  <td>{e.probabilidade}×{e.severidade}={n.valor}<br />{n.nome}</td><td>{e.medidas}</td><td>{e.epis}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="declaracao">Declaramos ter participado da análise de riscos desta atividade, conhecer os perigos identificados e as medidas de controle, e nos comprometemos a cumpri-las. Qualquer mudança nas condições exige a revisão desta APR.</p>
        <table>
          <thead><tr><th style={{ width: '60%' }}>Nome do participante</th><th>Assinatura</th></tr></thead>
          <tbody>
            {Array.from({ length: Math.max(5, apr.equipe.split(',').filter(Boolean).length) }, (_, i) => (
              <tr key={i}><td style={{ height: 28 }}>{apr.equipe.split(',')[i]?.trim() ?? ''}</td><td /></tr>
            ))}
          </tbody>
        </table>
        <div className="assinaturas">
          <div>{apr.responsavel}<br />Responsável pela APR</div>
          <div>Supervisor / encarregado<br />Liberação da atividade</div>
        </div>
      </div>
    </>
  )
}
