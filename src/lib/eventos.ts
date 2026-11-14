// Junta todas as datas do sistema (vencimentos, prazos, reuniões...) em uma lista de eventos para a agenda.
import type { DB } from './types'
import { daEmpresaAtiva, nomes } from './store'

export interface Evento {
  data: string
  categoria: string
  titulo: string
  sub: string
  rota: string
  concluido?: boolean
}

export const CATEGORIAS: { nome: string; cor: string }[] = [
  { nome: 'Treinamento', cor: '#2563eb' },
  { nome: 'ASO', cor: '#7c3aed' },
  { nome: 'EPI', cor: '#d97706' },
  { nome: 'Extintor', cor: '#dc2626' },
  { nome: 'Ação', cor: '#0891b2' },
  { nome: 'Inspeção', cor: '#16a34a' },
  { nome: 'CIPA', cor: '#db2777' },
  { nome: 'DDS / PT', cor: '#64748b' },
]
export const corDa = (c: string) => CATEGORIAS.find((x) => x.nome === c)?.cor ?? '#64748b'

/** Mantém só o registro mais recente de cada chave (reciclagens substituem as anteriores). */
function ultimos<T extends { data: string }>(l: T[], chave: (x: T) => string) {
  const m = new Map<string, T>()
  for (const x of l) {
    const a = m.get(chave(x))
    if (!a || x.data > a.data) m.set(chave(x), x)
  }
  return [...m.values()]
}

export function gerarEventos(d: DB): Evento[] {
  const ev: Evento[] = []
  const ativos = new Set(daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado').map((c) => c.id))
  const doColab = <T extends { colaboradorId: string }>(l: T[]) => l.filter((r) => ativos.has(r.colaboradorId))

  for (const t of ultimos(doColab(d.treinamentos), (t) => t.colaboradorId + '|' + t.curso))
    if (t.validade) ev.push({ data: t.validade, categoria: 'Treinamento', titulo: `Reciclagem ${t.curso}`, sub: nomes.colaborador(d, t.colaboradorId), rota: '/app/treinamentos' })
  for (const a of ultimos(doColab(d.asos).filter((a) => a.validade), (a) => a.colaboradorId))
    ev.push({ data: a.validade, categoria: 'ASO', titulo: 'Exame periódico', sub: nomes.colaborador(d, a.colaboradorId), rota: '/app/asos' })
  for (const e of d.epis) if (e.validadeCa) ev.push({ data: e.validadeCa, categoria: 'EPI', titulo: `Validade do CA ${e.ca}`, sub: e.nome, rota: '/app/epis' })
  for (const e of ultimos(doColab(d.entregas), (e) => e.colaboradorId + '|' + e.epiId))
    if (e.proximaTroca) ev.push({ data: e.proximaTroca, categoria: 'EPI', titulo: `Troca: ${nomes.epi(d, e.epiId)}`, sub: nomes.colaborador(d, e.colaboradorId), rota: '/app/entregas' })
  for (const x of daEmpresaAtiva(d, d.extintores).filter((x) => x.status !== 'Baixado')) {
    if (x.proximaRecarga) ev.push({ data: x.proximaRecarga, categoria: 'Extintor', titulo: `Recarga ${x.numero}`, sub: `${x.tipo} · ${x.local}`, rota: '/app/extintores' })
    if (x.proximoTeste) ev.push({ data: x.proximoTeste, categoria: 'Extintor', titulo: `Teste hidrostático ${x.numero}`, sub: x.local, rota: '/app/extintores' })
  }
  for (const a of daEmpresaAtiva(d, d.acoes))
    ev.push({ data: a.quando, categoria: 'Ação', titulo: a.oque, sub: `${a.quem || 'Sem responsável'} · ${a.status}`, rota: '/app/acoes', concluido: a.status === 'Concluída' })
  for (const i of daEmpresaAtiva(d, d.inspecoes))
    ev.push({ data: i.data, categoria: 'Inspeção', titulo: i.titulo, sub: `${i.local} · ${i.status}`, rota: '/app/inspecoes/' + i.id, concluido: i.status === 'Concluída' })
  for (const p of daEmpresaAtiva(d, d.pts))
    ev.push({ data: p.data, categoria: 'DDS / PT', titulo: `${p.numero} ${p.tipo}`, sub: p.atividade, rota: '/app/pt/' + p.id, concluido: p.status !== 'Aberta' })
  for (const x of daEmpresaAtiva(d, d.dds))
    ev.push({ data: x.data, categoria: 'DDS / PT', titulo: `DDS: ${x.tema}`, sub: `${x.participantes} participante(s)`, rota: '/app/dds/' + x.id, concluido: true })
  const cipas = daEmpresaAtiva(d, d.cipas)
  for (const c of cipas) ev.push({ data: c.fim, categoria: 'CIPA', titulo: `Fim do mandato da CIPA ${c.gestao}`, sub: nomes.empresa(d, c.empresaId), rota: '/app/cipa' })
  const idsCipa = new Set(cipas.map((c) => c.id))
  for (const r of d.reunioes.filter((r) => idsCipa.has(r.cipaId) && r.status !== 'Cancelada'))
    ev.push({ data: r.data, categoria: 'CIPA', titulo: `Reunião ${r.tipo.toLowerCase()} da CIPA`, sub: `${r.hora}${r.local ? ' · ' + r.local : ''}`, rota: '/app/cipa/reuniao/' + r.id, concluido: r.status === 'Realizada' })
  for (const r of daEmpresaAtiva(d, d.riscos))
    if (r.prazo) ev.push({ data: r.prazo, categoria: 'Ação', titulo: `PGR: ${r.medidasPropostas || r.perigo}`, sub: r.setor, rota: '/app/pgr' })

  return ev.filter((e) => e.data).sort((a, b) => a.data.localeCompare(b.data))
}

/** Arquivo .ics (Google Agenda, Outlook, celular) com os eventos como dia inteiro. */
export function gerarICS(eventos: Evento[]) {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n')
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sistema TST//PT-BR', 'CALSCALE:GREGORIAN']
  const agora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  eventos.forEach((e, i) => {
    const ini = e.data.replace(/-/g, '')
    const f = new Date(e.data + 'T12:00:00')
    f.setDate(f.getDate() + 1)
    const fim = `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}`
    linhas.push('BEGIN:VEVENT', `UID:${ini}-${i}@sistema-tst`, `DTSTAMP:${agora}`, `DTSTART;VALUE=DATE:${ini}`, `DTEND;VALUE=DATE:${fim}`, `SUMMARY:${esc(`[${e.categoria}] ${e.titulo}`)}`, `DESCRIPTION:${esc(e.sub)}`, 'END:VEVENT')
  })
  linhas.push('END:VCALENDAR')
  return linhas.join('\r\n')
}
