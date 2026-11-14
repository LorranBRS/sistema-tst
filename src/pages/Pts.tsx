// Permissão de Trabalho (PT): altura, quente, espaço confinado, eletricidade e escavação.
import { useState } from 'react'
import { ArrowLeft, Plus, Printer, Trash2 } from 'lucide-react'
import { BlocoAssinatura, ColetaAssinaturas, TabelaAssinaturas } from '../components/Assinatura'
import { BadgeStatus, Campo, Link, Modal, PageHead, Vazio, navegar, toast, CabecalhoDoc } from '../components/ui'
import { REF_GASES, TIPOS_PT } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { ItemPt, Pt } from '../lib/types'
import { fmtData, hoje } from '../lib/utils'

const CORES_STATUS_PT: Record<string, string> = { Aberta: 'info', Encerrada: 'ok', Cancelada: '' }

export default function Pts() {
  const d = useDB()
  const [nova, setNova] = useState(false)
  const lista = [...daEmpresaAtiva(d, d.pts)].sort((a, b) => b.data.localeCompare(a.data) || b.numero.localeCompare(a.numero))

  return (
    <>
      <PageHead titulo="Permissão de Trabalho" sub="PT para atividades de alto risco: altura, trabalho a quente, espaço confinado, eletricidade e escavação.">
        <button className="btn btn-primary" onClick={() => setNova(true)}>
          <Plus size={16} /> Nova PT
        </button>
      </PageHead>
      <div className="card">
        {lista.length === 0 ? (
          <Vazio texto="Nenhuma permissão de trabalho emitida." />
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Tipo</th>
                  <th>Atividade</th>
                  <th className="esconde-mobile">Empresa</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => {
                  const nao = p.checklist.filter((i) => i.resposta === 'N').length
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navegar('/app/pt/' + p.id)}>
                      <td>
                        <strong>{p.numero}</strong>
                        <span className="sub">{fmtData(p.data)} · {p.horaInicio}–{p.horaFim}</span>
                      </td>
                      <td>
                        {p.tipo}
                        {nao > 0 && <span className="sub" style={{ color: 'var(--danger)' }}>{nao} item(ns) "Não"</span>}
                      </td>
                      <td>
                        {p.atividade || <em>Sem descrição</em>}
                        <span className="sub">{p.local}</span>
                      </td>
                      <td className="esconde-mobile">{nomes.empresa(d, p.empresaId)}</td>
                      <td>
                        <span className={'badge ' + CORES_STATUS_PT[p.status]}>{p.status}</span>
                      </td>
                      <td>
                        <div className="acoes-linha">
                          <button className="btn btn-icon btn-danger" aria-label="Excluir" onClick={(e) => { e.stopPropagation(); if (confirm('Excluir esta PT?')) db.remover('pts', p.id) }}>
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
      {nova && <NovaPt onClose={() => setNova(false)} />}
    </>
  )
}

function NovaPt({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const [tipo, setTipo] = useState(TIPOS_PT[0].tipo)
  const [empresaId, setEmpresa] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  const [erro, setErro] = useState('')

  function criar() {
    if (!empresaId) return setErro('Cadastre ou selecione uma empresa.')
    const m = TIPOS_PT.find((t) => t.tipo === tipo)!
    const id = db.adicionar('pts', {
      empresaId,
      numero: 'PT-' + String(d.pts.length + 1).padStart(3, '0'),
      tipo,
      atividade: '',
      local: '',
      data: hoje(),
      horaInicio: '07:00',
      horaFim: '17:00',
      executantes: '',
      emitente: d.config.tecnico,
      aprNumero: '',
      checklist: m.itens.map((texto) => ({ texto, resposta: '' as ItemPt['resposta'] })),
      medicoes: { o2: '', lel: '', h2s: '', co: '' },
      observacoes: '',
      status: 'Aberta',
    })
    onClose()
    navegar('/app/pt/' + id)
  }

  return (
    <Modal
      titulo="Nova permissão de trabalho"
      onClose={onClose}
      rodape={
        <>
          {erro && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{erro}</span>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={criar}>Emitir PT</button>
        </>
      }
    >
      <div className="field" style={{ marginBottom: 14 }}>
        <label>Tipo de trabalho</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
          {TIPOS_PT.map((t) => (
            <button
              key={t.tipo}
              type="button"
              className="card"
              onClick={() => setTipo(t.tipo)}
              style={{ textAlign: 'left', padding: 12, cursor: 'pointer', borderColor: tipo === t.tipo ? 'var(--primary)' : undefined, outline: tipo === t.tipo ? '2px solid var(--primary-soft)' : undefined }}
            >
              <span className="badge info">{t.nr}</span>
              <div style={{ fontWeight: 600, marginTop: 6, fontSize: 14 }}>{t.tipo}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.itens.length} verificações{t.medicoes ? ' + gases' : ''}</div>
            </button>
          ))}
        </div>
      </div>
      <Campo label="Empresa *">
        <select className="input" value={empresaId} onChange={(e) => setEmpresa(e.target.value)}>
          <option value="">Selecione...</option>
          {d.empresas.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </Campo>
    </Modal>
  )
}

export function EditarPt({ id }: { id: string }) {
  const d = useDB()
  const pt = d.pts.find((p) => p.id === id)
  if (!pt) return <Vazio texto="PT não encontrada."><Link to="/app/pt">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === pt.empresaId)
  const modelo = TIPOS_PT.find((t) => t.tipo === pt.tipo)
  const set = (patch: Partial<Pt>) => db.atualizar('pts', pt.id, patch)
  const responder = (i: number, r: ItemPt['resposta']) => set({ checklist: pt.checklist.map((it, j) => (j === i ? { ...it, resposta: it.resposta === r ? '' : r } : it)) })
  const pendentes = pt.checklist.filter((i) => i.resposta === '').length
  const naoConf = pt.checklist.filter((i) => i.resposta === 'N').length
  const aprs = d.aprs.filter((a) => a.empresaId === pt.empresaId)
  const fora = foraDaFaixa(pt)

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/pt"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Permissões de trabalho</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`${pt.numero} · ${pt.tipo}`} sub="As alterações são salvas automaticamente.">
          <select className="input" style={{ width: 'auto' }} value={pt.status} aria-label="Status" onChange={(e) => {
            const st = e.target.value as Pt['status']
            if (st === 'Encerrada' && (pendentes || naoConf) && !confirm(`Há ${pendentes} item(ns) sem resposta e ${naoConf} marcado(s) como "Não". Encerrar mesmo assim?`)) return
            set({ status: st }); toast('Status atualizado')
          }}>
            <option>Aberta</option><option>Encerrada</option><option>Cancelada</option>
          </select>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>

        {(naoConf > 0 || fora.length > 0) && (
          <div className="resultado perigo" style={{ marginBottom: 16 }}>
            <strong>Atenção: não liberar a atividade.</strong>{' '}
            {naoConf > 0 && `${naoConf} verificação(ões) marcada(s) como "Não". `}
            {fora.length > 0 && `Medição fora da faixa: ${fora.join(', ')}.`}
          </div>
        )}

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <Campo label="Atividade" full><input className="input" value={pt.atividade} onChange={(e) => set({ atividade: e.target.value })} placeholder="Descreva o serviço a ser executado" /></Campo>
            <Campo label="Local"><input className="input" value={pt.local} onChange={(e) => set({ local: e.target.value })} /></Campo>
            <Campo label="APR vinculada">
              <input className="input" list="dl-aprs" value={pt.aprNumero} onChange={(e) => set({ aprNumero: e.target.value })} placeholder="Ex.: APR-001" />
              <datalist id="dl-aprs">{aprs.map((a) => <option key={a.id} value={a.numero}>{a.atividade}</option>)}</datalist>
            </Campo>
            <Campo label="Data"><input className="input" type="date" value={pt.data} onChange={(e) => set({ data: e.target.value })} /></Campo>
            <div className="form-grid" style={{ gap: 10 }}>
              <Campo label="Início"><input className="input" type="time" value={pt.horaInicio} onChange={(e) => set({ horaInicio: e.target.value })} /></Campo>
              <Campo label="Término"><input className="input" type="time" value={pt.horaFim} onChange={(e) => set({ horaFim: e.target.value })} /></Campo>
            </div>
            <Campo label="Executantes" full><input className="input" value={pt.executantes} onChange={(e) => set({ executantes: e.target.value })} placeholder="Nomes separados por vírgula" /></Campo>
            <Campo label="Emitente"><input className="input" value={pt.emitente} onChange={(e) => set({ emitente: e.target.value })} /></Campo>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <h3>Verificações de segurança ({modelo?.nr})</h3>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>S = sim · N = não · NA = não se aplica</span>
          </div>
          {pt.checklist.map((it, i) => (
            <div className="item-insp" key={i}>
              <span className="n">{i + 1}</span>
              <div style={{ fontWeight: 500 }}>{it.texto}</div>
              <div className="resp" role="group" aria-label={`Resposta do item ${i + 1}`}>
                {(['S', 'N', 'NA'] as const).map((op) => (
                  <button key={op} className={(op === 'S' ? 'C' : op === 'N' ? 'NC' : 'NA') + (it.resposta === op ? ' on' : '')} aria-pressed={it.resposta === op} onClick={() => responder(i, op)}>
                    {op}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {modelo?.medicoes && (
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Medição de gases (antes da entrada)</h3>
            <div className="form-grid">
              {(['o2', 'lel', 'h2s', 'co'] as const).map((g) => (
                <Campo key={g} label={{ o2: 'O₂ (%)', lel: 'Inflamáveis (% LIE)', h2s: 'H₂S (ppm)', co: 'CO (ppm)' }[g]} ajuda={REF_GASES[g]}>
                  <input className="input" inputMode="decimal" value={pt.medicoes[g]} onChange={(e) => set({ medicoes: { ...pt.medicoes, [g]: e.target.value } })} />
                </Campo>
              ))}
            </div>
          </div>
        )}

        <div className="card card-pad">
          <Campo label="Observações / medidas adicionais">
            <textarea className="input" value={pt.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
          </Campo>
        </div>
        <ColetaAssinaturas
          titulo="Assinaturas dos executantes"
          ajuda="Cada executante assina na tela confirmando que conhece os riscos e as medidas desta PT. As assinaturas saem na versão impressa."
          assinaturas={pt.assinaturas}
          sugestoes={pt.executantes.split(',').map((n) => n.trim()).filter(Boolean)}
          onChange={(l) => set({ assinaturas: l })}
        />
      </div>

      {/* Versão para impressão */}
      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>PERMISSÃO DE TRABALHO – {pt.numero}</h2>
        <div className="sub-doc">{pt.tipo} ({modelo?.nr}) · {empresa?.nome} · CNPJ {empresa?.cnpj}</div>
        <div className="info">
          <div><b>Atividade:</b> {pt.atividade}</div>
          <div><b>Local:</b> {pt.local}</div>
          <div><b>Data:</b> {fmtData(pt.data)} · {pt.horaInicio} às {pt.horaFim}</div>
          <div><b>APR:</b> {pt.aprNumero || '—'}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>Executantes:</b> {pt.executantes}</div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Verificação</th><th style={{ width: 60 }}>Sim</th><th style={{ width: 60 }}>Não</th><th style={{ width: 60 }}>N/A</th></tr></thead>
          <tbody>
            {pt.checklist.map((it, i) => (
              <tr key={i}><td>{i + 1}</td><td>{it.texto}</td><td>{it.resposta === 'S' ? 'X' : ''}</td><td>{it.resposta === 'N' ? 'X' : ''}</td><td>{it.resposta === 'NA' ? 'X' : ''}</td></tr>
            ))}
          </tbody>
        </table>
        {modelo?.medicoes && (
          <table>
            <thead><tr><th>O₂ (%)</th><th>Inflamáveis (% LIE)</th><th>H₂S (ppm)</th><th>CO (ppm)</th></tr></thead>
            <tbody><tr><td>{pt.medicoes.o2}</td><td>{pt.medicoes.lel}</td><td>{pt.medicoes.h2s}</td><td>{pt.medicoes.co}</td></tr></tbody>
          </table>
        )}
        {pt.observacoes && <p className="declaracao"><b>Observações:</b> {pt.observacoes}</p>}
        <p className="declaracao">A atividade só pode ser iniciada com todas as verificações atendidas. Esta PT vale somente para a data, o horário e o local indicados e deve permanecer no local de trabalho. Qualquer mudança nas condições exige a suspensão do serviço e a emissão de nova PT.</p>
        <TabelaAssinaturas rotulo="Executante" nomes={pt.executantes.split(',')} assinaturas={pt.assinaturas} />
        <div className="assinaturas">
          <BlocoAssinatura imagem={pt.emitente === d.config.tecnico ? d.config.assinatura : undefined}>{pt.emitente}<br />Emitente da PT</BlocoAssinatura>
          <div>Responsável pela área<br />Liberação</div>
        </div>
        <div className="assinaturas" style={{ marginTop: 36 }}>
          <div>Encerramento – data/hora</div>
          <div>Assinatura do encerramento</div>
        </div>
        <p className="nota" style={{ textAlign: 'center' }}>Status: <BadgeStatus valor={pt.status} /></p>
      </div>
    </>
  )
}

function foraDaFaixa(pt: Pt) {
  const n = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')))
  const m = pt.medicoes
  const f: string[] = []
  if (isFinite(n(m.o2)) && (n(m.o2) < 19.5 || n(m.o2) > 23)) f.push('O₂')
  if (isFinite(n(m.lel)) && n(m.lel) >= 10) f.push('inflamáveis')
  if (isFinite(n(m.h2s)) && n(m.h2s) > 8) f.push('H₂S')
  if (isFinite(n(m.co)) && n(m.co) > 39) f.push('CO')
  return f
}
