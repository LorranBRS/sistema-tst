// Absenteísmo: registro de atestados e afastamentos, taxa mensal e alertas (INSS, ASO de retorno).
import { useState } from 'react'
import { CrudPage, type CrudConfig, type Reg } from '../components/CrudPage'
import { BarrasHorizontais, BarrasVerticais } from '../components/Graficos'
import { Campo } from '../components/ui'
import { MOTIVOS_ATESTADO } from '../lib/catalogos'
import { daEmpresaAtiva, useDB } from '../lib/store'
import type { Atestado, DB } from '../lib/types'
import { MESES_CURTOS, addDias, diasAte, fmtData, fmtNum, hoje } from '../lib/utils'

/** Último dia do afastamento (o dia de início conta como 1º dia). */
export const fimAtestado = (a: { data: string; dias: number | string }) => addDias(a.data, Math.max(1, Number(a.dias) || 1) - 1)

/** Dias de afastamento que caem em cada mês do ano (atestados que viram o mês são divididos). */
function diasPorMes(l: Atestado[], ano: string) {
  const meses = Array(12).fill(0) as number[]
  for (const a of l) {
    const n = Math.max(1, Number(a.dias) || 1)
    for (let i = 0; i < n; i++) {
      const dia = addDias(a.data, i)
      if (dia.startsWith(ano)) meses[Number(dia.slice(5, 7)) - 1]++
    }
  }
  return meses
}

const diasNoMes = (ano: string, m: number) => new Date(Number(ano), m + 1, 0).getDate()

/** Mesmo colaborador e mesmo CID somando mais de 15 dias em 60 dias: encaminhar ao INSS. */
export function alertaInss(a: Reg, todos: Atestado[]) {
  if (Number(a.dias) > 15) return true
  if (!a.cid?.trim()) return false
  const ini = addDias(a.data, -60)
  const soma = todos
    .filter((x) => x.colaboradorId === a.colaboradorId && x.cid?.trim().toUpperCase() === a.cid.trim().toUpperCase() && x.data >= ini && x.data <= a.data)
    .reduce((s, x) => s + (Number(x.dias) || 0), 0)
  return soma > 15
}

const colab = (d: DB, id: string) => d.colaboradores.find((c) => c.id === id)

const cfg: CrudConfig = {
  colecao: 'atestados',
  titulo: 'Absenteísmo',
  sub: 'Atestados e afastamentos: taxa de absenteísmo por mês e setor, alertas de INSS e de ASO de retorno ao trabalho.',
  singular: 'Atestado',
  escopo: 'colaborador',
  campos: [
    { nome: 'colaboradorId', rotulo: 'Colaborador', tipo: 'ref', ref: 'colaboradores', obrigatorio: true, full: true },
    { nome: 'data', rotulo: 'Início do afastamento', tipo: 'date', obrigatorio: true },
    { nome: 'dias', rotulo: 'Dias de afastamento', tipo: 'number', obrigatorio: true, ajuda: 'Dias corridos do atestado' },
    { nome: 'motivo', rotulo: 'Motivo', tipo: 'select', opcoes: MOTIVOS_ATESTADO, obrigatorio: true },
    { nome: 'cid', rotulo: 'CID (opcional)', tipo: 'text', placeholder: 'Ex.: M54', ajuda: 'Só registre com autorização do trabalhador (LGPD)' },
    { nome: 'medico', rotulo: 'Médico / CRM', tipo: 'text', full: true },
    { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', full: true },
  ],
  padroes: () => ({ data: hoje(), dias: 1, motivo: 'Doença' }),
  colunas: [
    {
      rotulo: 'Colaborador',
      texto: (r, d) => `${colab(d, r.colaboradorId)?.nome ?? ''} ${colab(d, r.colaboradorId)?.setor ?? ''}`,
      render: (r, d) => <div><strong>{colab(d, r.colaboradorId)?.nome ?? '—'}</strong><span className="sub">{colab(d, r.colaboradorId)?.setor}</span></div>,
    },
    { rotulo: 'Período', texto: (r) => `${fmtData(r.data)} ${fmtData(fimAtestado(r as Atestado))}`, render: (r) => <div>{fmtData(r.data)}<span className="sub">até {fmtData(fimAtestado(r as Atestado))}</span></div> },
    { rotulo: 'Dias', texto: (r) => String(r.dias) },
    { rotulo: 'Motivo', texto: (r) => `${r.motivo} ${r.cid ?? ''}`, render: (r) => <div>{r.motivo}{r.cid && <span className="sub">CID {r.cid}</span>}</div>, esconderMobile: true },
    {
      rotulo: 'Alertas',
      texto: (r, d) => [alertaInss(r, d.atestados) ? 'INSS' : '', Number(r.dias) >= 30 ? 'ASO de retorno' : ''].join(' '),
      render: (r, d) => {
        const inss = alertaInss(r, d.atestados)
        const retorno = Number(r.dias) >= 30
        const emCurso = diasAte(fimAtestado(r as Atestado)) >= 0 && diasAte(r.data) <= 0
        if (!inss && !retorno && !emCurso) return '—'
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {emCurso && <span className="badge info">Afastado agora</span>}
            {inss && <span className="badge vencido" title="Mais de 15 dias (ou soma de atestados do mesmo CID em 60 dias): a partir do 16º dia o afastamento é pago pelo INSS">INSS</span>}
            {retorno && <span className="badge avencer" title="Afastamento de 30 dias ou mais por doença ou acidente exige ASO de retorno ao trabalho (NR-7)">ASO de retorno</span>}
          </div>
        )
      },
    },
  ],
  filtros: [
    { rotulo: 'Afastados agora', teste: (r) => diasAte(fimAtestado(r as Atestado)) >= 0 && diasAte(r.data) <= 0 },
    { rotulo: 'Este mês', teste: (r) => r.data.slice(0, 7) === hoje().slice(0, 7) },
    { rotulo: 'Encaminhar ao INSS', teste: (r, d) => alertaInss(r, d.atestados) },
  ],
  ordenar: (a, b) => b.data.localeCompare(a.data),
  cabecalhoExtra: <Resumo />,
}

export default function Absenteismo() {
  return <CrudPage cfg={cfg} />
}

function Resumo() {
  const d = useDB()
  const lista = daEmpresaAtiva(d, d.atestados)
  const anos = [...new Set([hoje().slice(0, 4), ...lista.map((a) => a.data.slice(0, 4))])].sort().reverse()
  const [ano, setAno] = useState(anos[0])
  const colabs = daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado')
  const anoAtual = ano === hoje().slice(0, 4)
  const mesesValidos = anoAtual ? Number(hoje().slice(5, 7)) : 12

  const porMes = diasPorMes(lista, ano)
  const taxaMes = porMes.map((dias, m) => (m < mesesValidos && colabs.length ? (dias / (colabs.length * diasNoMes(ano, m))) * 100 : 0))
  const diasAno = porMes.reduce((s, x) => s + x, 0)
  const diasPossiveis = colabs.length * MESES_CURTOS.slice(0, mesesValidos).reduce((s, _, m) => s + diasNoMes(ano, m), 0)
  const taxaAno = diasPossiveis ? (diasAno / diasPossiveis) * 100 : 0
  const doAno = lista.filter((a) => a.data.startsWith(ano))

  const contar = (pares: [string, number][]) =>
    [...pares.reduce((m, [k, v]) => m.set(k, (m.get(k) ?? 0) + v), new Map<string, number>())].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor)
  const porMotivo = contar(doAno.map((a) => [a.motivo, Number(a.dias) || 0]))
  const porSetor = contar(doAno.map((a) => [colab(d, a.colaboradorId)?.setor || 'Sem setor', Number(a.dias) || 0]))
  const porPessoa = contar(doAno.map((a) => [colab(d, a.colaboradorId)?.nome ?? '—', Number(a.dias) || 0])).slice(0, 5)
  const afastadosAgora = lista.filter((a) => diasAte(fimAtestado(a)) >= 0 && diasAte(a.data) <= 0).length
  const pct = (v: number) => `${fmtNum(v, v < 10 ? 2 : 1)}%`

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="card card-pad" style={{ marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 140 }}>
          <Campo label="Ano"><select className="input" value={ano} onChange={(e) => setAno(e.target.value)}>{anos.map((a) => <option key={a}>{a}</option>)}</select></Campo>
        </div>
        <p className="nota" style={{ margin: 0, flex: 1, minWidth: 220 }}>
          Taxa de absenteísmo = dias de atestado ÷ (colaboradores ativos × dias do mês) × 100. Base atual: {colabs.length} colaborador(es).
        </p>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><div className="rotulo">Taxa no ano</div><div className="valor">{pct(taxaAno)}</div><div className="detalhe">{anoAtual ? `até ${MESES_CURTOS[mesesValidos - 1].toLowerCase()}` : 'ano completo'}</div></div>
        <div className="card stat"><div className="rotulo">Dias de afastamento</div><div className="valor">{diasAno}</div><div className="detalhe">{doAno.length} atestado(s) no ano</div></div>
        <div className="card stat"><div className="rotulo">Média por colaborador</div><div className="valor">{colabs.length ? fmtNum(diasAno / colabs.length, 1) : '—'}</div><div className="detalhe">dias no ano</div></div>
        <div className="card stat"><div className="rotulo">Afastados agora</div><div className="valor">{afastadosAgora}</div><div className="detalhe">com atestado em curso</div></div>
      </div>
      <div className="grid grid-2">
        <div className="card card-pad">
          <h3 className="titulo-graf">Taxa de absenteísmo por mês</h3>
          <BarrasVerticais rotulos={MESES_CURTOS} valores={taxaMes.map((v) => [v])} series={[{ nome: 'Taxa', cor: 'var(--s1)' }]} formato={(v) => pct(v)} />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Dias por motivo</h3>
          <BarrasHorizontais itens={porMotivo} cor="var(--s1)" formato={(v) => `${v} d`} vazio="Nenhum atestado no ano." />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Dias por setor</h3>
          <BarrasHorizontais itens={porSetor} cor="var(--s1)" formato={(v) => `${v} d`} vazio="Nenhum atestado no ano." />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Quem mais se afastou</h3>
          <BarrasHorizontais itens={porPessoa} cor="var(--s1)" formato={(v) => `${v} d`} vazio="Nenhum atestado no ano." />
        </div>
      </div>
    </div>
  )
}
