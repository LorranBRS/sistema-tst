// CIPA (NR-5): gestão/mandato, membros, calendário de reuniões e atas com assinatura.
import { useState } from 'react'
import { ArrowLeft, CalendarPlus, Plus, Printer, Trash2, Users } from 'lucide-react'
import { ColetaAssinaturas, TabelaAssinaturas } from '../components/Assinatura'
import { BadgeStatus, CabecalhoDoc, Campo, Link, Modal, PageHead, Vazio, navegar, toast } from '../components/ui'
import { FUNCOES_CIPA } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { Cipa as TCipa, MembroCipa, ReuniaoCipa } from '../lib/types'
import { addMeses, diasAte, fmtData, hoje } from '../lib/utils'

export default function Cipa() {
  const d = useDB()
  const cipas = [...daEmpresaAtiva(d, d.cipas)].sort((a, b) => b.inicio.localeCompare(a.inicio))
  const [selId, setSel] = useState<string>('')
  const [nova, setNova] = useState(false)
  const cipa = cipas.find((c) => c.id === selId) ?? cipas[0]

  return (
    <>
      <PageHead titulo="CIPA" sub="Comissão Interna de Prevenção de Acidentes e de Assédio (NR-5): mandato, membros, reuniões mensais e atas.">
        {cipas.length > 1 && (
          <select className="input" style={{ width: 'auto' }} value={cipa?.id} onChange={(e) => setSel(e.target.value)} aria-label="Gestão">
            {cipas.map((c) => <option key={c.id} value={c.id}>{nomes.empresa(d, c.empresaId)} · {c.gestao}</option>)}
          </select>
        )}
        <button className="btn btn-primary" onClick={() => setNova(true)}><Plus size={16} /> Nova gestão</button>
      </PageHead>
      {!cipa ? (
        <div className="card"><Vazio texto="Nenhuma gestão da CIPA cadastrada para esta empresa."><button className="btn btn-primary" onClick={() => setNova(true)}><Plus size={16} /> Cadastrar gestão</button></Vazio></div>
      ) : (
        <Gestao cipa={cipa} />
      )}
      {nova && <NovaGestao onClose={() => setNova(false)} onCriada={setSel} />}
    </>
  )
}

function Gestao({ cipa }: { cipa: TCipa }) {
  const d = useDB()
  const reunioes = d.reunioes.filter((r) => r.cipaId === cipa.id).sort((a, b) => a.data.localeCompare(b.data))
  const fim = diasAte(cipa.fim)
  const realizadas = reunioes.filter((r) => r.status === 'Realizada').length
  const proxima = reunioes.find((r) => r.status === 'Agendada' && r.data >= hoje())
  const [membro, setMembro] = useState<MembroCipa | null>(null)

  function agendarMensais() {
    const existentes = new Set(reunioes.map((r) => r.data.slice(0, 7)))
    let n = 0
    for (let i = 0; ; i++) {
      const data = addMeses(cipa.inicio, i)
      if (data > cipa.fim) break
      if (existentes.has(data.slice(0, 7))) continue
      db.adicionar('reunioes', { cipaId: cipa.id, data, hora: '14:00', tipo: 'Ordinária', local: '', pauta: '', deliberacoes: '', presentes: [], status: 'Agendada' })
      n++
    }
    toast(n ? `${n} reunião(ões) ordinária(s) agendada(s)` : 'Todos os meses do mandato já têm reunião')
  }

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><div className="rotulo">Gestão</div><div className="valor" style={{ fontSize: 22 }}>{cipa.gestao}</div><div className="detalhe">{nomes.empresa(d, cipa.empresaId)}</div></div>
        <div className="card stat">
          <div className="rotulo">Mandato</div>
          <div className="valor" style={{ fontSize: 22, color: fim < 0 ? 'var(--danger)' : fim <= 60 ? 'var(--warn)' : undefined }}>{fim < 0 ? 'Encerrado' : `${fim} dias`}</div>
          <div className="detalhe">{fmtData(cipa.inicio)} a {fmtData(cipa.fim)}</div>
        </div>
        <div className="card stat"><div className="rotulo">Reuniões realizadas</div><div className="valor">{realizadas}/{reunioes.length}</div><div className="detalhe">ordinárias + extraordinárias</div></div>
        <div className="card stat"><div className="rotulo">Próxima reunião</div><div className="valor" style={{ fontSize: 22 }}>{proxima ? fmtData(proxima.data) : '—'}</div><div className="detalhe">{proxima ? `${proxima.hora} · ${proxima.tipo}` : 'Nenhuma agendada'}</div></div>
      </div>
      {fim >= 0 && fim <= 60 && (
        <div className="resultado alerta" style={{ marginBottom: 16 }}>
          O mandato termina em {fim} dia(s). Pela NR-5, o empregador deve convocar a eleição da próxima gestão com no mínimo 60 dias de antecedência do término do mandato.
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <Users size={17} />
            <h3>Membros ({cipa.membros.length})</h3>
            <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setMembro({ nome: '', funcao: 'Titular', representacao: 'Empregados' })}><Plus size={14} /> Membro</button>
          </div>
          {cipa.membros.length === 0 ? <Vazio texto="Nenhum membro cadastrado." /> : (
            <ul className="lista">
              {cipa.membros.map((m, i) => (
                <li key={i}>
                  <div style={{ minWidth: 0 }}>
                    <div className="titulo">{m.nome}</div>
                    <div className="sub">{m.funcao} · {m.representacao === 'Empregador' ? 'indicado pelo empregador' : 'eleito pelos empregados'}</div>
                  </div>
                  <div className="dir">
                    <button className="btn btn-icon btn-danger" aria-label={`Remover ${m.nome}`} onClick={() => confirm(`Remover ${m.nome} da CIPA?`) && db.atualizar('cipas', cipa.id, { membros: cipa.membros.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Reuniões</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" onClick={agendarMensais} title="Cria uma reunião ordinária por mês até o fim do mandato"><CalendarPlus size={14} /> Agendar mensais</button>
              <button className="btn btn-sm btn-primary" onClick={() => {
                const id = db.adicionar('reunioes', { cipaId: cipa.id, data: hoje(), hora: '14:00', tipo: 'Extraordinária', local: '', pauta: '', deliberacoes: '', presentes: [], status: 'Agendada' })
                navegar('/app/cipa/reuniao/' + id)
              }}><Plus size={14} /> Reunião</button>
            </div>
          </div>
          {reunioes.length === 0 ? <Vazio texto="Nenhuma reunião. Use “Agendar mensais” para montar o calendário do mandato." /> : (
            <ul className="lista" style={{ maxHeight: 460, overflowY: 'auto' }}>
              {reunioes.map((r) => (
                <li key={r.id} style={{ cursor: 'pointer' }} onClick={() => navegar('/app/cipa/reuniao/' + r.id)}>
                  <div style={{ minWidth: 0 }}>
                    <div className="titulo">{fmtData(r.data)} · {r.tipo}</div>
                    <div className="sub">{r.pauta || 'Pauta a definir'}</div>
                  </div>
                  <div className="dir">
                    <BadgeStatus valor={r.status === 'Realizada' ? 'Concluída' : r.status === 'Cancelada' ? 'Encerrada' : r.data < hoje() ? 'Em andamento' : 'Aberta'} />
                    <div className="sub">{r.status === 'Agendada' && r.data < hoje() ? 'Ata pendente' : r.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="nota">Lembretes da NR-5: reuniões ordinárias mensais conforme calendário preestabelecido; atas assinadas pelos presentes e disponíveis aos empregados; treinamento dos membros (curso NR-05 na Matriz de treinamentos).</p>
      {membro && <NovoMembro cipa={cipa} inicial={membro} onClose={() => setMembro(null)} />}
    </>
  )
}

function NovoMembro({ cipa, inicial, onClose }: { cipa: TCipa; inicial: MembroCipa; onClose: () => void }) {
  const d = useDB()
  const [m, setM] = useState(inicial)
  const sugestoes = d.colaboradores.filter((c) => c.empresaId === cipa.empresaId && c.status !== 'Desligado').map((c) => c.nome)
  return (
    <Modal titulo="Adicionar membro" onClose={onClose} rodape={
      <>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => { if (!m.nome.trim()) return; db.atualizar('cipas', cipa.id, { membros: [...cipa.membros, { ...m, nome: m.nome.trim() }] }); toast('Membro adicionado'); onClose() }}>Adicionar</button>
      </>
    }>
      <div className="form-grid">
        <Campo label="Nome *" full>
          <input className="input" list="dl-membros" value={m.nome} onChange={(e) => setM({ ...m, nome: e.target.value })} autoFocus />
          <datalist id="dl-membros">{sugestoes.map((n) => <option key={n} value={n} />)}</datalist>
        </Campo>
        <Campo label="Função na CIPA">
          <select className="input" value={m.funcao} onChange={(e) => setM({ ...m, funcao: e.target.value })}>{FUNCOES_CIPA.map((f) => <option key={f}>{f}</option>)}</select>
        </Campo>
        <Campo label="Representação">
          <select className="input" value={m.representacao} onChange={(e) => setM({ ...m, representacao: e.target.value })}>
            <option value="Empregados">Empregados (eleito)</option>
            <option value="Empregador">Empregador (indicado)</option>
          </select>
        </Campo>
      </div>
    </Modal>
  )
}

function NovaGestao({ onClose, onCriada }: { onClose: () => void; onCriada: (id: string) => void }) {
  const d = useDB()
  const [empresaId, setEmpresa] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  const [inicio, setInicio] = useState(hoje())
  const ano = Number(inicio.slice(0, 4))
  return (
    <Modal titulo="Nova gestão da CIPA" onClose={onClose} rodape={
      <>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => {
          if (!empresaId) return
          const id = db.adicionar('cipas', { empresaId, gestao: `${ano}/${ano + 1}`, inicio, fim: addMeses(inicio, 12), membros: [] })
          onCriada(id)
          if (d.config.empresaAtiva && d.config.empresaAtiva !== empresaId) db.configurar({ empresaAtiva: empresaId })
          toast('Gestão criada'); onClose()
        }}>Criar gestão</button>
      </>
    }>
      <div className="form-grid">
        <Campo label="Empresa">
          <select className="input" value={empresaId} onChange={(e) => setEmpresa(e.target.value)}>{d.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
        </Campo>
        <Campo label="Início do mandato" ajuda="Mandato de 1 ano (NR-5)"><input className="input" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Campo>
      </div>
    </Modal>
  )
}

/* ---------- Reunião / ata ---------- */
export function ReuniaoCipaPagina({ id }: { id: string }) {
  const d = useDB()
  const r = d.reunioes.find((x) => x.id === id)
  if (!r) return <Vazio texto="Reunião não encontrada."><Link to="/app/cipa">Voltar</Link></Vazio>
  const cipa = d.cipas.find((c) => c.id === r.cipaId)
  const empresa = d.empresas.find((e) => e.id === cipa?.empresaId)
  const set = (p: Partial<ReuniaoCipa>) => db.atualizar('reunioes', r.id, p)
  const membros = cipa?.membros ?? []
  const togglePresente = (nome: string) => set({ presentes: r.presentes.includes(nome) ? r.presentes.filter((n) => n !== nome) : [...r.presentes, nome] })
  const numero = cipa ? d.reunioes.filter((x) => x.cipaId === cipa.id && x.data <= r.data).length : 1

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/cipa"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> CIPA</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`Reunião ${r.tipo.toLowerCase()} · ${fmtData(r.data)}`} sub={`${empresa?.nome ?? '—'} · gestão ${cipa?.gestao ?? '—'}`}>
          <select className="input" style={{ width: 'auto' }} value={r.status} onChange={(e) => { set({ status: e.target.value as ReuniaoCipa['status'] }); toast('Status atualizado') }} aria-label="Status">
            <option>Agendada</option><option>Realizada</option><option>Cancelada</option>
          </select>
          <button className="btn btn-danger" onClick={() => { if (confirm('Excluir esta reunião?')) { db.remover('reunioes', r.id); navegar('/app/cipa') } }}><Trash2 size={16} /></button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir ata</button>
        </PageHead>
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <Campo label="Data"><input className="input" type="date" value={r.data} onChange={(e) => set({ data: e.target.value })} /></Campo>
            <div className="form-grid" style={{ gap: 10 }}>
              <Campo label="Hora"><input className="input" type="time" value={r.hora} onChange={(e) => set({ hora: e.target.value })} /></Campo>
              <Campo label="Tipo">
                <select className="input" value={r.tipo} onChange={(e) => set({ tipo: e.target.value })}><option>Ordinária</option><option>Extraordinária</option></select>
              </Campo>
            </div>
            <Campo label="Local" full><input className="input" value={r.local} onChange={(e) => set({ local: e.target.value })} /></Campo>
            <Campo label="Pauta" full><textarea className="input" style={{ minHeight: 70 }} value={r.pauta} onChange={(e) => set({ pauta: e.target.value })} /></Campo>
            <Campo label="Deliberações / encaminhamentos" full><textarea className="input" style={{ minHeight: 110 }} value={r.deliberacoes} onChange={(e) => set({ deliberacoes: e.target.value })} /></Campo>
          </div>
        </div>
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Presença dos membros ({r.presentes.length}/{membros.length})</h3>
          {membros.length === 0 ? <p className="nota">Cadastre os membros na tela da CIPA.</p> : (
            <div className="chips">
              {membros.map((m) => (
                <button key={m.nome} className={'chip' + (r.presentes.includes(m.nome) ? ' ativo' : '')} aria-pressed={r.presentes.includes(m.nome)} onClick={() => togglePresente(m.nome)}>
                  {m.nome} <span style={{ opacity: 0.7 }}>· {m.funcao}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <ColetaAssinaturas
          titulo="Assinaturas da ata"
          ajuda="Ao final da reunião, cada presente assina na tela. As assinaturas saem na ata impressa."
          assinaturas={r.assinaturas}
          sugestoes={r.presentes}
          onChange={(l) => set({ assinaturas: l })}
        />
      </div>

      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>ATA DA {numero}ª REUNIÃO {r.tipo.toUpperCase()} DA CIPA</h2>
        <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj} · Gestão {cipa?.gestao}</div>
        <p className="declaracao">
          Aos {fmtData(r.data)}, às {r.hora}, {r.local ? `em ${r.local}, ` : ''}reuniram-se os membros da Comissão Interna de Prevenção de Acidentes e de Assédio
          {r.presentes.length ? `, com a presença de: ${r.presentes.join(', ')}` : ''}, para tratar da seguinte pauta:
        </p>
        <p className="declaracao" style={{ whiteSpace: 'pre-wrap' }}><b>Pauta:</b> {r.pauta || '—'}</p>
        <p className="declaracao" style={{ whiteSpace: 'pre-wrap' }}><b>Deliberações e encaminhamentos:</b> {r.deliberacoes || '—'}</p>
        <p className="declaracao">Nada mais havendo a tratar, a reunião foi encerrada e lavrada a presente ata, que vai assinada pelos presentes.</p>
        <TabelaAssinaturas rotulo="Membro presente" nomes={r.presentes} assinaturas={r.assinaturas} minimo={Math.max(4, r.presentes.length)} />
        <div className="assinaturas">
          <div>{membros.find((m) => m.funcao === 'Presidente')?.nome ?? 'Presidente'}<br />Presidente da CIPA</div>
          <div>{membros.find((m) => m.funcao.startsWith('Secret'))?.nome ?? 'Secretário(a)'}<br />Secretário(a)</div>
        </div>
      </div>
    </>
  )
}
