// Agenda: calendário mensal com todos os vencimentos, prazos, inspeções e reuniões.
import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { PageHead, navegar } from '../components/ui'
import { CATEGORIAS, corDa, gerarEventos, gerarICS, type Evento } from '../lib/eventos'
import { useDB } from '../lib/store'
import { addMeses, baixarArquivo, diasAte, fmtData, hoje } from '../lib/utils'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Agenda() {
  const d = useDB()
  const [mes, setMes] = useState(hoje().slice(0, 7))
  const [dia, setDia] = useState(hoje())
  const [ocultas, setOcultas] = useState<string[]>([])
  const todos = useMemo(() => gerarEventos(d), [d])
  const eventos = todos.filter((e) => !ocultas.includes(e.categoria))

  const [ano, m] = mes.split('-').map(Number)
  const primeiro = new Date(ano, m - 1, 1)
  const diasNoMes = new Date(ano, m, 0).getDate()
  const celulas: (string | null)[] = [
    ...Array.from({ length: primeiro.getDay() }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`),
  ]
  while (celulas.length % 7) celulas.push(null)
  const porDia = new Map<string, Evento[]>()
  for (const e of eventos) if (e.data.startsWith(mes)) porDia.set(e.data, [...(porDia.get(e.data) ?? []), e])

  const doDia = eventos.filter((e) => e.data === dia)
  const atrasados = eventos.filter((e) => !e.concluido && e.data < hoje() && ['Treinamento', 'ASO', 'EPI', 'Extintor', 'Ação'].includes(e.categoria))
  const proximos = eventos.filter((e) => e.data >= hoje() && diasAte(e.data) <= 30 && !e.concluido)

  function exportar() {
    const futuros = eventos.filter((e) => e.data >= hoje() && !e.concluido)
    baixarArquivo(`agenda-sistema-tst-${hoje()}.ics`, gerarICS(futuros), 'text/calendar')
  }

  return (
    <>
      <PageHead titulo="Agenda" sub="Todos os vencimentos, prazos, inspeções, DDS e reuniões da CIPA em um calendário.">
        <button className="btn" onClick={exportar} title="Baixa um arquivo .ics para importar no Google Agenda, Outlook ou no calendário do celular">
          <Download size={16} /> Exportar para o calendário
        </button>
      </PageHead>

      <div className="chips" style={{ marginBottom: 14 }}>
        {CATEGORIAS.map((c) => {
          const on = !ocultas.includes(c.nome)
          return (
            <button key={c.nome} className="chip" aria-pressed={on} onClick={() => setOcultas(on ? [...ocultas, c.nome] : ocultas.filter((x) => x !== c.nome))} style={{ opacity: on ? 1 : 0.45 }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: c.cor, marginRight: 6 }} />
              {c.nome} ({todos.filter((e) => e.categoria === c.nome).length})
            </button>
          )
        })}
      </div>

      <div className="agenda-grid">
        <div className="card">
          <div className="card-head">
            <button className="btn btn-icon" aria-label="Mês anterior" onClick={() => setMes(addMeses(mes + '-01', -1).slice(0, 7))}><ChevronLeft size={18} /></button>
            <h3 style={{ minWidth: 150, textAlign: 'center' }}>{MESES[m - 1]} {ano}</h3>
            <button className="btn btn-icon" aria-label="Próximo mês" onClick={() => setMes(addMeses(mes + '-01', 1).slice(0, 7))}><ChevronRight size={18} /></button>
            <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setMes(hoje().slice(0, 7)); setDia(hoje()) }}>Hoje</button>
          </div>
          <div className="cal">
            {SEMANA.map((s) => <div key={s} className="cal-sem">{s}</div>)}
            {celulas.map((c, i) => {
              if (!c) return <div key={i} className="cal-dia vazio-cal" />
              const evs = porDia.get(c) ?? []
              const cls = ['cal-dia', c === hoje() ? 'hoje' : '', c === dia ? 'sel' : ''].join(' ')
              return (
                <button key={c} className={cls} onClick={() => setDia(c)} aria-label={`${fmtData(c)}: ${evs.length} evento(s)`}>
                  <span className="num-dia">{Number(c.slice(8))}</span>
                  <span className="cal-evs">
                    {evs.slice(0, 3).map((e, k) => (
                      <span key={k} className="cal-ev" style={{ background: corDa(e.categoria) + (e.concluido ? '55' : '') }} title={`${e.categoria}: ${e.titulo}`}>
                        <span className="cal-ev-txt">{e.titulo}</span>
                      </span>
                    ))}
                    {evs.length > 3 && <span className="cal-mais">+{evs.length - 3}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <ListaEventos titulo={`${fmtData(dia)}${dia === hoje() ? ' (hoje)' : ''}`} eventos={doDia} vazio="Nada neste dia." />
          {atrasados.length > 0 && <ListaEventos titulo="Atrasados" eventos={atrasados.slice(-15).reverse()} vazio="" perigo />}
          <ListaEventos titulo="Próximos 30 dias" eventos={proximos.slice(0, 25)} vazio="Nada programado para os próximos 30 dias." />
        </div>
      </div>
    </>
  )
}

function ListaEventos({ titulo, eventos, vazio, perigo }: { titulo: string; eventos: Evento[]; vazio: string; perigo?: boolean }) {
  return (
    <div className="card">
      <div className="card-head">
        <CalendarDays size={16} color={perigo ? 'var(--danger)' : undefined} />
        <h3>{titulo}</h3>
        <span className={'badge ' + (perigo ? 'vencido' : '')}>{eventos.length}</span>
      </div>
      {eventos.length === 0 ? <div className="vazio" style={{ padding: 20 }}>{vazio}</div> : (
        <ul className="lista" style={{ maxHeight: 340, overflowY: 'auto' }}>
          {eventos.map((e, i) => (
            <li key={i} style={{ cursor: 'pointer' }} onClick={() => navegar(e.rota)}>
              <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: corDa(e.categoria), flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="titulo" style={{ textDecoration: e.concluido ? 'line-through' : undefined, opacity: e.concluido ? 0.7 : 1 }}>{e.titulo}</div>
                <div className="sub">{e.categoria} · {e.sub}</div>
              </div>
              <div className="dir sub">{fmtData(e.data).slice(0, 5)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

