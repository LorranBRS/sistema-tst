// SIPAT (NR-5): planejamento da semana, programação por dia, lista de presença com assinatura e relatório final.
import { useState } from 'react'
import { ArrowLeft, CalendarRange, CheckCheck, Plus, Printer, Sparkles, Trash2 } from 'lucide-react'
import { BlocoAssinatura, ColetaAssinaturas, TabelaAssinaturas } from '../components/Assinatura'
import { CabecalhoDoc, Campo, Link, Modal, PageHead, Vazio, navegar, toast } from '../components/ui'
import { TEMAS_SIPAT } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { AtividadeSipat, Sipat } from '../lib/types'
import { addDias, diasAte, fmtData, hoje } from '../lib/utils'

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const diaSemana = (iso: string) => DIAS_SEMANA[new Date(iso + 'T12:00:00').getDay()]

/** Programação sugerida: um tema por dia útil entre início e fim. */
function programacaoSugerida(inicio: string, fim: string): AtividadeSipat[] {
  const dias: string[] = []
  for (let d = inicio; d <= fim && dias.length < 10; d = addDias(d, 1)) {
    const w = new Date(d + 'T12:00:00').getDay()
    if (w !== 0 && w !== 6) dias.push(d)
  }
  if (!dias.length) dias.push(inicio)
  const meio = TEMAS_SIPAT.slice(1, -1)
  return dias.map((dia, i) => ({
    dia,
    hora: '08:00',
    tema: i === 0 ? TEMAS_SIPAT[0] : i === dias.length - 1 && dias.length > 1 ? TEMAS_SIPAT[TEMAS_SIPAT.length - 1] : meio[(i - 1) % meio.length],
    palestrante: '',
    local: '',
  }))
}

export default function Sipats() {
  const d = useDB()
  const [nova, setNova] = useState(false)
  const lista = [...daEmpresaAtiva(d, d.sipats)].sort((a, b) => b.inicio.localeCompare(a.inicio))
  return (
    <>
      <PageHead titulo="SIPAT" sub="Semana Interna de Prevenção de Acidentes do Trabalho (NR-5): programação, presença e relatório.">
        <button className="btn btn-primary" onClick={() => setNova(true)}><Plus size={16} /> Nova SIPAT</button>
      </PageHead>
      {lista.length === 0 ? (
        <Vazio texto="Nenhuma SIPAT cadastrada. Comece pela programação: o sistema sugere um tema por dia.">
          <button className="btn btn-primary" onClick={() => setNova(true)}><Plus size={16} /> Nova SIPAT</button>
        </Vazio>
      ) : (
        <div className="grid grid-2">
          {lista.map((s) => {
            const falta = diasAte(s.inicio)
            return (
              <Link key={s.id} to={'/app/sipat/' + s.id} className="card card-pad card-link">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <CalendarRange size={18} style={{ color: 'var(--primary)' }} />
                  <strong style={{ fontSize: 16 }}>SIPAT {s.ano}</strong>
                  <span className={'badge ' + (s.status === 'Realizada' ? 'ok' : falta >= 0 && falta <= 30 ? 'avencer' : 'info')} style={{ marginLeft: 'auto' }}>
                    {s.status === 'Realizada' ? 'Realizada' : falta > 0 ? `Começa em ${falta} dia(s)` : diasAte(s.fim) >= 0 ? 'Acontecendo' : 'Planejada'}
                  </span>
                </div>
                {s.tema && <p style={{ margin: '8px 0 4px', fontStyle: 'italic' }}>"{s.tema}"</p>}
                <div className="sub">{nomes.empresa(d, s.empresaId)} · {fmtData(s.inicio)} a {fmtData(s.fim)}</div>
                <div className="sub">{s.atividades.length} atividade(s) · {s.presencas?.length ?? 0} assinatura(s) de presença</div>
              </Link>
            )
          })}
        </div>
      )}
      {nova && <NovaSipat onClose={() => setNova(false)} />}
    </>
  )
}

function NovaSipat({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const [empresaId, setEmpresaId] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  const [inicio, setInicio] = useState(addDias(hoje(), 30))
  const [fim, setFim] = useState(addDias(hoje(), 34))
  const [tema, setTema] = useState('')
  function criar() {
    if (!empresaId) return alert('Cadastre uma empresa primeiro.')
    if (fim < inicio) return alert('A data final deve ser depois da inicial.')
    const id = db.adicionar('sipats', {
      empresaId, ano: inicio.slice(0, 4), tema, inicio, fim, responsavel: 'CIPA', status: 'Planejada',
      atividades: programacaoSugerida(inicio, fim), orcamento: '', avaliacao: '',
    })
    toast('SIPAT criada com programação sugerida')
    onClose()
    navegar('/app/sipat/' + id)
  }
  return (
    <Modal titulo="Nova SIPAT" onClose={onClose} rodape={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={criar}>Criar</button></>}>
      <div className="form-grid">
        <Campo label="Empresa" full>
          <select className="input" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
            {d.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </Campo>
        <Campo label="Início"><input className="input" type="date" value={inicio} onChange={(e) => { setInicio(e.target.value); if (e.target.value > fim) setFim(addDias(e.target.value, 4)) }} /></Campo>
        <Campo label="Fim"><input className="input" type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></Campo>
        <Campo label="Tema / slogan (opcional)" full><input className="input" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: Segurança se faz com atitude" /></Campo>
      </div>
      <p className="nota">O sistema monta uma programação com um tema por dia útil; depois é só ajustar horários, palestrantes e locais.</p>
    </Modal>
  )
}

export function DetalheSipat({ id }: { id: string }) {
  const d = useDB()
  const s = d.sipats.find((x) => x.id === id)
  const [imprimir, setImprimir] = useState<'programacao' | 'presenca' | 'relatorio'>('programacao')
  if (!s) return <Vazio texto="SIPAT não encontrada."><Link to="/app/sipat">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === s.empresaId)
  const set = (p: Partial<Sipat>) => db.atualizar('sipats', s.id, p)
  const setAtiv = (i: number, p: Partial<AtividadeSipat>) => set({ atividades: s.atividades.map((a, j) => (j === i ? { ...a, ...p } : a)) })
  const ordenadas = [...s.atividades].sort((a, b) => (a.dia + a.hora).localeCompare(b.dia + b.hora))
  const colabs = d.colaboradores.filter((c) => c.empresaId === s.empresaId && c.status === 'Ativo').map((c) => c.nome)
  const presentes = s.presencas ?? []
  function imprimirDoc(tipo: typeof imprimir) {
    setImprimir(tipo)
    setTimeout(() => window.print(), 50)
  }

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/sipat"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> SIPAT</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`SIPAT ${s.ano}`} sub={`${empresa?.nome ?? '—'} · ${fmtData(s.inicio)} a ${fmtData(s.fim)}`}>
          <button className="btn" onClick={() => imprimirDoc('programacao')}><Printer size={16} /> Programação</button>
          <button className="btn" onClick={() => imprimirDoc('presenca')}><Printer size={16} /> Lista de presença</button>
          <button className="btn" onClick={() => imprimirDoc('relatorio')}><Printer size={16} /> Relatório</button>
          {s.status === 'Planejada' ? (
            <button className="btn btn-primary" onClick={() => { set({ status: 'Realizada' }); toast('SIPAT marcada como realizada') }}><CheckCheck size={16} /> Marcar como realizada</button>
          ) : (
            <button className="btn" onClick={() => set({ status: 'Planejada' })}>Reabrir</button>
          )}
          <button className="btn btn-danger btn-icon" aria-label="Excluir SIPAT" onClick={() => { if (confirm('Excluir esta SIPAT?')) { db.remover('sipats', s.id); navegar('/app/sipat') } }}><Trash2 size={16} /></button>
        </PageHead>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <Campo label="Tema / slogan" full><input className="input" value={s.tema} onChange={(e) => set({ tema: e.target.value })} /></Campo>
            <Campo label="Início"><input className="input" type="date" value={s.inicio} onChange={(e) => set({ inicio: e.target.value, ano: e.target.value.slice(0, 4) })} /></Campo>
            <Campo label="Fim"><input className="input" type="date" value={s.fim} onChange={(e) => set({ fim: e.target.value })} /></Campo>
            <Campo label="Organização"><input className="input" value={s.responsavel} onChange={(e) => set({ responsavel: e.target.value })} placeholder="Ex.: CIPA gestão 2026/2027" /></Campo>
            <Campo label="Orçamento"><input className="input" value={s.orcamento} onChange={(e) => set({ orcamento: e.target.value })} placeholder="Ex.: R$ 2.000,00" /></Campo>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <h3>Programação</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" onClick={() => { if (!s.atividades.length || confirm('Substituir a programação atual pela sugerida?')) set({ atividades: programacaoSugerida(s.inicio, s.fim) }) }}><Sparkles size={14} /> Sugerir</button>
              <button className="btn btn-sm btn-primary" onClick={() => set({ atividades: [...s.atividades, { dia: ordenadas[ordenadas.length - 1]?.dia ?? s.inicio, hora: '14:00', tema: '', palestrante: '', local: '' }] })}><Plus size={14} /> Atividade</button>
            </div>
          </div>
          <datalist id="temas-sipat">{TEMAS_SIPAT.map((t) => <option key={t} value={t} />)}</datalist>
          <div className="tabela-wrap">
            <table className="tabela" style={{ minWidth: 1000 }}>
              <thead><tr><th style={{ width: 160 }}>Dia</th><th style={{ width: 110 }}>Hora</th><th>Tema / atividade</th><th style={{ width: 170 }}>Palestrante</th><th style={{ width: 130 }}>Local</th><th style={{ width: 50 }} /></tr></thead>
              <tbody>
                {s.atividades.map((a, i) => (
                  <tr key={i}>
                    <td><input className="input" type="date" value={a.dia} onChange={(e) => setAtiv(i, { dia: e.target.value })} aria-label="Dia" /></td>
                    <td><input className="input" type="time" value={a.hora} onChange={(e) => setAtiv(i, { hora: e.target.value })} aria-label="Hora" /></td>
                    <td><input className="input" list="temas-sipat" value={a.tema} onChange={(e) => setAtiv(i, { tema: e.target.value })} aria-label="Tema" /></td>
                    <td><input className="input" value={a.palestrante} onChange={(e) => setAtiv(i, { palestrante: e.target.value })} aria-label="Palestrante" /></td>
                    <td><input className="input" value={a.local} onChange={(e) => setAtiv(i, { local: e.target.value })} aria-label="Local" /></td>
                    <td><button className="btn btn-icon btn-danger" aria-label="Remover atividade" onClick={() => set({ atividades: s.atividades.filter((_, j) => j !== i) })}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
                {s.atividades.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Nenhuma atividade. Use "Sugerir" ou "Atividade".</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <ColetaAssinaturas
          titulo="Presença"
          ajuda="Passe o celular para cada participante assinar durante as atividades."
          assinaturas={presentes}
          sugestoes={colabs}
          onChange={(l) => set({ presencas: l })}
        />

        <div className="card card-pad" style={{ marginTop: 16 }}>
          <Campo label="Avaliação final e resultados" full ajuda="Vai para o relatório: participação, pontos positivos, o que melhorar na próxima">
            <textarea className="input" style={{ minHeight: 90 }} value={s.avaliacao} onChange={(e) => set({ avaliacao: e.target.value })} />
          </Campo>
        </div>
      </div>

      {/* Impressão: só o documento escolhido */}
      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        {imprimir === 'programacao' && (
          <>
            <h2>SIPAT {s.ano} – PROGRAMAÇÃO</h2>
            {s.tema && <div className="sub-doc" style={{ fontSize: 15, fontStyle: 'italic' }}>"{s.tema}"</div>}
            <div className="sub-doc">{empresa?.nome} · {fmtData(s.inicio)} a {fmtData(s.fim)}</div>
            <table>
              <thead><tr><th style={{ width: 150 }}>Dia</th><th style={{ width: 70 }}>Hora</th><th>Atividade</th><th>Palestrante</th><th>Local</th></tr></thead>
              <tbody>
                {ordenadas.map((a, i) => (
                  <tr key={i}><td>{fmtData(a.dia)}<br /><small>{diaSemana(a.dia)}</small></td><td>{a.hora}</td><td><b>{a.tema}</b></td><td>{a.palestrante}</td><td>{a.local}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="declaracao">Participe! A SIPAT é organizada pela {s.responsavel || 'CIPA'} em conjunto com o SESMT.</p>
          </>
        )}
        {imprimir === 'presenca' && (
          <>
            <h2>LISTA DE PRESENÇA – SIPAT {s.ano}</h2>
            <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj} · {fmtData(s.inicio)} a {fmtData(s.fim)}</div>
            <TabelaAssinaturas rotulo="Participante" nomes={[]} assinaturas={presentes} minimo={Math.max(15, presentes.length)} />
          </>
        )}
        {imprimir === 'relatorio' && (
          <>
            <h2>RELATÓRIO DA SIPAT {s.ano}</h2>
            <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj}</div>
            <div className="info">
              <div><b>Período:</b> {fmtData(s.inicio)} a {fmtData(s.fim)}</div>
              <div><b>Tema:</b> {s.tema || '—'}</div>
              <div><b>Organização:</b> {s.responsavel}</div>
              <div><b>Orçamento:</b> {s.orcamento || '—'}</div>
              <div><b>Atividades:</b> {s.atividades.length}</div>
              <div><b>Participantes (assinaturas):</b> {presentes.length}{colabs.length ? ` de ${colabs.length} colaboradores ativos (${Math.round((presentes.length / colabs.length) * 100)}%)` : ''}</div>
            </div>
            <table>
              <thead><tr><th style={{ width: 120 }}>Dia</th><th>Atividade</th><th>Palestrante</th></tr></thead>
              <tbody>{ordenadas.map((a, i) => <tr key={i}><td>{fmtData(a.dia)} {a.hora}</td><td>{a.tema}</td><td>{a.palestrante}</td></tr>)}</tbody>
            </table>
            <p className="declaracao"><b>Avaliação e resultados:</b> {s.avaliacao || '—'}</p>
            <div className="assinaturas">
              <BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}<br />Técnico(a) de Segurança do Trabalho</BlocoAssinatura>
              <div>Presidente da CIPA</div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
