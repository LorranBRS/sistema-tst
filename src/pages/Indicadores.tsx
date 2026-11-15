// Indicadores anuais de SST: ocorrências, TF/TG, conformidade, ações, treinamentos e comparativo entre empresas.
import { useState } from 'react'
import { Printer } from 'lucide-react'
import { BarrasHorizontais, BarrasVerticais, Linha } from '../components/Graficos'
import { Campo, PageHead } from '../components/ui'
import { TIPOS_ACIDENTE } from '../lib/catalogos'
import { daEmpresaAtiva, empresaDoRegistro, useDB } from '../lib/store'
import type { DB } from '../lib/types'
import { MESES_CURTOS, diasAte, fmtNum, hoje } from '../lib/utils'
import { resumo } from './Inspecoes'
import { pendenciasMatriz } from './Matriz'

const ehAcidente = (t: string) => TIPOS_ACIDENTE.includes(t)

/** Indicadores do ano para um conjunto de registros (uma empresa ou todas). */
function calcular(d: DB, ano: string, horas: number, empresaId?: string) {
  const filtra = <T extends { id: string }>(l: T[]) => (empresaId === undefined ? daEmpresaAtiva(d, l) : l.filter((r) => empresaDoRegistro(d, r) === empresaId))
  const doAno = <T extends { data: string; id: string }>(l: T[]) => filtra(l).filter((r) => r.data.startsWith(ano))
  const colabs = filtra(d.colaboradores).filter((c) => c.status !== 'Desligado')
  const ocorr = doAno(d.ocorrencias)
  const acid = ocorr.filter((o) => ehAcidente(o.tipo))
  const comLesao = acid.filter((o) => o.gravidade !== 'Sem lesão')
  const diasPerdidos = acid.reduce((s, o) => s + (Number(o.diasPerdidos) || 0), 0)
  const anoAtual = ano === hoje().slice(0, 4)
  const mesesDecorridos = anoAtual ? Number(hoje().slice(5, 7)) : 12
  const hht = colabs.length * horas * mesesDecorridos
  const insp = doAno(d.inspecoes).filter((i) => i.status === 'Concluída')
  const confs = insp.map((i) => resumo(i).conf).filter((c): c is number => c !== null)
  const acoes = filtra(d.acoes)
  const treinos = doAno(d.treinamentos)
  return {
    colabs: colabs.length, ocorr, acid, comLesao, diasPerdidos, hht, mesesDecorridos, insp, acoes, treinos,
    tf: hht ? (comLesao.length * 1e6) / hht : NaN,
    tg: hht ? (diasPerdidos * 1e6) / hht : NaN,
    conf: confs.length ? Math.round(confs.reduce((s, c) => s + c, 0) / confs.length) : null,
    acoesPend: acoes.filter((a) => a.status !== 'Concluída').length,
    acoesAtras: acoes.filter((a) => a.status !== 'Concluída' && diasAte(a.quando) < 0).length,
    horasTreino: treinos.reduce((s, t) => s + (Number(t.cargaHoraria) || 0), 0),
  }
}

export default function Indicadores() {
  const d = useDB()
  const anos = [...new Set([hoje().slice(0, 4), ...d.ocorrencias.map((o) => o.data.slice(0, 4)), ...d.inspecoes.map((i) => i.data.slice(0, 4))])].sort().reverse()
  const [ano, setAno] = useState(anos[0])
  const [horas, setHoras] = useState('176')
  const h = Number(horas) || 0
  const k = calcular(d, ano, h)
  const meses = MESES_CURTOS.map((m) => m)
  const doMes = <T extends { data: string }>(l: T[], m: number) => l.filter((r) => Number(r.data.slice(5, 7)) === m + 1)
  const ateMes = (m: number) => (ano === hoje().slice(0, 4) ? m < k.mesesDecorridos : true)

  // Ocorrências por mês: acidentes x demais
  const porMes = meses.map((_, m) => { const l = doMes(k.ocorr, m); const a = l.filter((o) => ehAcidente(o.tipo)).length; return [a, l.length - a] })
  // TF e TG por mês (HHT mensal = colaboradores × horas)
  const hhtMes = k.colabs * h
  const tfMes = meses.map((_, m) => (ateMes(m) && hhtMes ? (doMes(k.comLesao, m).length * 1e6) / hhtMes : 0))
  const tgMes = meses.map((_, m) => (ateMes(m) && hhtMes ? (doMes(k.acid, m).reduce((s, o) => s + (Number(o.diasPerdidos) || 0), 0) * 1e6) / hhtMes : 0))
  // Conformidade por mês
  const confMes = meses.map((_, m) => {
    const c = doMes(k.insp, m).map((i) => resumo(i).conf).filter((x): x is number => x !== null)
    return c.length ? Math.round(c.reduce((s, x) => s + x, 0) / c.length) : null
  })
  const contar = (l: string[]) => [...l.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor)
  const porTipo = contar(k.ocorr.map((o) => o.tipo))
  const porParte = contar(k.acid.map((o) => o.parteCorpo?.trim()).filter(Boolean) as string[]).slice(0, 8)
  const acoesStatus = ['Aberta', 'Em andamento', 'Concluída'].map((s) => ({ rotulo: s, valor: k.acoes.filter((a) => a.status === s).length }))
  const horasMes = meses.map((_, m) => [doMes(k.treinos, m).reduce((s, t) => s + (Number(t.cargaHoraria) || 0), 0)])
  const empresas = d.config.empresaAtiva ? [] : d.empresas
  const f2 = (v: number) => (isFinite(v) ? fmtNum(v, 2) : '—')

  return (
    <>
      <PageHead titulo="Indicadores" sub="Desempenho de segurança no ano: ocorrências, taxas de frequência e gravidade, inspeções, ações e treinamentos.">
        <button className="btn" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
      </PageHead>
      <div className="card card-pad nao-imprimir" style={{ marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 140 }}>
          <Campo label="Ano"><select className="input" value={ano} onChange={(e) => setAno(e.target.value)}>{anos.map((a) => <option key={a}>{a}</option>)}</select></Campo>
        </div>
        <div style={{ width: 230 }}>
          <Campo label="Horas trabalhadas por pessoa/mês" ajuda="Base do HHT para TF e TG"><input className="input" inputMode="numeric" value={horas} onChange={(e) => setHoras(e.target.value)} /></Campo>
        </div>
        <p className="nota" style={{ margin: 0, flex: 1, minWidth: 220 }}>HHT estimado: {k.colabs} colaborador(es) × {h} h × {k.mesesDecorridos} mês(es) = {fmtNum(k.hht)} h. Use a empresa no topo para ver uma unidade só.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><div className="rotulo">Acidentes no ano</div><div className="valor">{k.acid.length}</div><div className="detalhe">{k.comLesao.length} com lesão · {k.diasPerdidos} dias perdidos</div></div>
        <div className="card stat"><div className="rotulo">Taxa de frequência</div><div className="valor">{f2(k.tf)}</div><div className="detalhe">acidentes com lesão por 1 milhão de HHT</div></div>
        <div className="card stat"><div className="rotulo">Taxa de gravidade</div><div className="valor">{f2(k.tg)}</div><div className="detalhe">dias perdidos por 1 milhão de HHT</div></div>
        <div className="card stat"><div className="rotulo">Conformidade das inspeções</div><div className="valor">{k.conf === null ? '—' : k.conf + '%'}</div><div className="detalhe">{k.insp.length} inspeção(ões) concluída(s)</div></div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <h3 className="titulo-graf">Ocorrências por mês</h3>
          <BarrasVerticais rotulos={meses} valores={porMes} series={[{ nome: 'Acidentes', cor: 'var(--s2)' }, { nome: 'Incidentes e quase acidentes', cor: 'var(--s1)' }]} />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Conformidade das inspeções por mês</h3>
          <Linha rotulos={meses} valores={confMes} cor="var(--s1)" formato={(v) => `${Math.round(v)}%`} />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Taxa de frequência por mês</h3>
          <BarrasVerticais rotulos={meses} valores={tfMes.map((v) => [v])} series={[{ nome: 'TF', cor: 'var(--s1)' }]} formato={(v) => fmtNum(v, v >= 100 ? 0 : 1)} />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Taxa de gravidade por mês</h3>
          <BarrasVerticais rotulos={meses} valores={tgMes.map((v) => [v])} series={[{ nome: 'TG', cor: 'var(--s1)' }]} formato={(v) => fmtNum(v, 0)} />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Ocorrências por tipo</h3>
          <BarrasHorizontais itens={porTipo} cor="var(--s1)" />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Partes do corpo atingidas (acidentes)</h3>
          <BarrasHorizontais itens={porParte} cor="var(--s1)" vazio="Nenhuma parte do corpo registrada nos acidentes do ano." />
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Plano de ação</h3>
          <BarrasHorizontais itens={acoesStatus} cor="var(--s1)" />
          <p className="nota">{k.acoesPend} pendente(s), {k.acoesAtras} atrasada(s) · {k.acoes.length ? Math.round(((k.acoes.length - k.acoesPend) / k.acoes.length) * 100) : 0}% concluídas</p>
        </div>
        <div className="card card-pad">
          <h3 className="titulo-graf">Horas de treinamento por mês</h3>
          <BarrasVerticais rotulos={meses} valores={horasMes} series={[{ nome: 'Horas', cor: 'var(--s1)' }]} formato={(v) => `${Math.round(v)}h`} />
          <p className="nota">{k.horasTreino} h no ano · {pendenciasMatriz(d)} pendência(s) na matriz de treinamentos hoje</p>
        </div>
      </div>

      {empresas.length > 1 && (
        <div className="card">
          <div className="card-head"><h3>Comparativo entre empresas – {ano}</h3></div>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Empresa</th><th>Colab.</th><th>Acidentes</th><th>Dias perdidos</th><th>TF</th><th>TG</th><th>Conformidade</th><th>Ações pendentes</th><th>Horas de treino</th></tr></thead>
              <tbody>
                {empresas.map((e) => {
                  const x = calcular(d, ano, h, e.id)
                  return (
                    <tr key={e.id}>
                      <td><strong>{e.nome}</strong></td><td>{x.colabs}</td><td>{x.acid.length}</td><td>{x.diasPerdidos}</td>
                      <td>{f2(x.tf)}</td><td>{f2(x.tg)}</td><td>{x.conf === null ? '—' : x.conf + '%'}</td>
                      <td>{x.acoesPend}{x.acoesAtras ? <span className="sub" style={{ color: 'var(--danger)' }}>{x.acoesAtras} atrasada(s)</span> : null}</td>
                      <td>{x.horasTreino}h</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="nota">TF e TG conforme NBR 14280, com HHT estimado. Para valores oficiais, use as horas efetivamente trabalhadas (folha de ponto).</p>
    </>
  )
}
