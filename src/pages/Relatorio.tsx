// Relatório mensal de SST por empresa, pronto para imprimir ou salvar em PDF.
import { useState, type ReactNode } from 'react'
import { Printer } from 'lucide-react'
import { Campo, PageHead } from '../components/ui'
import { TIPOS_ACIDENTE } from '../lib/catalogos'
import { empresaDoRegistro, nomes, useDB } from '../lib/store'
import type { DB } from '../lib/types'
import { diasAte, fmtData, fmtNum, hoje } from '../lib/utils'
import { resumo } from './Inspecoes'
import { cursosDaFuncao, statusCurso } from './Matriz'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export default function Relatorio() {
  const d = useDB()
  const [empresaId, setEmpresa] = useState(d.config.empresaAtiva || '')
  const [mes, setMes] = useState(hoje().slice(0, 7))
  const [horas, setHoras] = useState('176')
  const [obs, setObs] = useState('')

  const empresa = d.empresas.find((e) => e.id === empresaId)
  const daEmpresa = <T extends { id: string }>(l: T[]) => (empresaId ? l.filter((r) => empresaDoRegistro(d, r) === empresaId) : l)
  const noMes = <T extends { data: string }>(l: T[]) => l.filter((r) => r.data.startsWith(mes))
  const [ano, m] = mes.split('-').map(Number)
  const fimMes = `${mes}-${String(new Date(ano, m, 0).getDate()).padStart(2, '0')}`

  const colabs = daEmpresa(d.colaboradores).filter((c) => c.status !== 'Desligado' && (!c.admissao || c.admissao <= fimMes))
  const ativos = colabs.filter((c) => c.status === 'Ativo').length
  const ocorrMes = noMes(daEmpresa(d.ocorrencias)).sort((a, b) => a.data.localeCompare(b.data))
  const acidMes = ocorrMes.filter((o) => TIPOS_ACIDENTE.includes(o.tipo))
  const comLesao = acidMes.filter((o) => o.gravidade !== 'Sem lesão')
  const diasPerdidos = acidMes.reduce((s, o) => s + (Number(o.diasPerdidos) || 0), 0)
  const hhtMes = colabs.length * (Number(horas) || 0)
  const tf = hhtMes ? (comLesao.length * 1e6) / hhtMes : NaN
  const tg = hhtMes ? (diasPerdidos * 1e6) / hhtMes : NaN

  // acumulado do ano até o mês
  const acidAno = daEmpresa(d.ocorrencias).filter((o) => o.data >= `${ano}-01-01` && o.data <= fimMes && TIPOS_ACIDENTE.includes(o.tipo))
  const hhtAno = colabs.length * (Number(horas) || 0) * m
  const tfAno = hhtAno ? (acidAno.filter((o) => o.gravidade !== 'Sem lesão').length * 1e6) / hhtAno : NaN
  const tgAno = hhtAno ? (acidAno.reduce((s, o) => s + (Number(o.diasPerdidos) || 0), 0) * 1e6) / hhtAno : NaN

  const ultimoAcid = daEmpresa(d.ocorrencias).filter((o) => TIPOS_ACIDENTE.includes(o.tipo) && o.data <= fimMes).sort((a, b) => b.data.localeCompare(a.data))[0]
  const refDia = fimMes < hoje() ? fimMes : hoje()
  const diasSem = ultimoAcid ? diasAte(refDia) - diasAte(ultimoAcid.data) : null

  const insp = noMes(daEmpresa(d.inspecoes)).sort((a, b) => a.data.localeCompare(b.data))
  // média só das inspeções concluídas (as em andamento aparecem na tabela, mas não entram no indicador)
  const confs = insp.filter((i) => i.status === 'Concluída').map((i) => resumo(i).conf).filter((c): c is number => c !== null)
  const confMedia = confs.length ? Math.round(confs.reduce((s, c) => s + c, 0) / confs.length) : null
  const treinos = noMes(daEmpresa(d.treinamentos)).sort((a, b) => a.data.localeCompare(b.data))
  const horasTreino = treinos.reduce((s, t) => s + (Number(t.cargaHoraria) || 0), 0)
  const asos = noMes(daEmpresa(d.asos))
  const entregas = noMes(daEmpresa(d.entregas))
  const dds = noMes(daEmpresa(d.dds))
  const pts = noMes(daEmpresa(d.pts))
  const acoes = daEmpresa(d.acoes)
  const acoesPend = acoes.filter((a) => a.status !== 'Concluída').sort((a, b) => a.quando.localeCompare(b.quando))
  const atrasadas = acoesPend.filter((a) => a.quando < hoje())
  const pend = pendencias(d, colabs.map((c) => c.id))

  const titulo = `${MESES[m - 1].charAt(0).toUpperCase()}${MESES[m - 1].slice(1)} de ${ano}`

  return (
    <>
      <div className="nao-imprimir">
        <PageHead titulo="Relatório mensal" sub="Resumo de SST do mês por empresa: indicadores, ocorrências, inspeções, treinamentos, DDS e pendências.">
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <Campo label="Empresa">
              <select className="input" value={empresaId} onChange={(e) => setEmpresa(e.target.value)}>
                <option value="">Todas as empresas</option>
                {d.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Mês de referência">
              <input className="input" type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} />
            </Campo>
            <Campo label="Horas trabalhadas por pessoa no mês" ajuda="Para calcular TF e TG">
              <input className="input" inputMode="numeric" value={horas} onChange={(e) => setHoras(e.target.value)} />
            </Campo>
            <Campo label="Observações do técnico" full ajuda="Aparece no fim do relatório (não fica salvo)">
              <textarea className="input" style={{ minHeight: 60 }} value={obs} onChange={(e) => setObs(e.target.value)} />
            </Campo>
          </div>
        </div>
      </div>

      <div className="doc relatorio">
        <h2>RELATÓRIO MENSAL DE SEGURANÇA E SAÚDE NO TRABALHO</h2>
        <div className="sub-doc">{titulo}</div>
        <div className="info">
          <div><b>Empresa:</b> {empresa?.nome ?? 'Todas as empresas'}</div>
          <div><b>CNPJ:</b> {empresa?.cnpj ?? '—'}</div>
          <div><b>Responsável técnico:</b> {d.config.tecnico}{d.config.registro ? ` – ${d.config.registro}` : ''}</div>
          <div><b>Emitido em:</b> {fmtData(hoje())}</div>
        </div>

        <h4 className="secao-doc">1. Indicadores</h4>
        <div className="kpis-doc">
          <Kpi rotulo="Colaboradores" valor={colabs.length} sub={`${ativos} ativos`} />
          <Kpi rotulo="Dias sem acidentes" valor={diasSem ?? '—'} sub={`em ${fmtData(refDia)}`} />
          <Kpi rotulo="Acidentes no mês" valor={acidMes.length} sub={`${diasPerdidos} dias perdidos`} />
          <Kpi rotulo="Quase acidentes / incidentes" valor={ocorrMes.length - acidMes.length} />
          <Kpi rotulo="TF do mês" valor={isFinite(tf) ? fmtNum(tf, 2) : '—'} sub={`ano: ${isFinite(tfAno) ? fmtNum(tfAno, 2) : '—'}`} />
          <Kpi rotulo="TG do mês" valor={isFinite(tg) ? fmtNum(tg, 2) : '—'} sub={`ano: ${isFinite(tgAno) ? fmtNum(tgAno, 2) : '—'}`} />
          <Kpi rotulo="Conformidade inspeções" valor={confMedia === null ? '—' : confMedia + '%'} sub={`${confs.length} concluída(s) de ${insp.length}`} />
          <Kpi rotulo="Horas de treinamento" valor={horasTreino} sub={`${treinos.length} capacitação(ões)`} />
        </div>
        <p className="nota">TF = acidentes com lesão × 1.000.000 ÷ HHT · TG = dias perdidos × 1.000.000 ÷ HHT (NBR 14280). HHT estimada: {colabs.length} pessoas × {horas || 0} h.</p>

        <h4 className="secao-doc">2. Ocorrências</h4>
        {ocorrMes.length ? (
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Gravidade</th><th>Envolvido</th><th>Local</th><th>CAT</th><th>Investigação</th></tr></thead>
            <tbody>
              {ocorrMes.map((o) => (
                <tr key={o.id}>
                  <td>{fmtData(o.data)}</td><td>{o.tipo}</td><td>{o.gravidade}{o.diasPerdidos ? ` (${o.diasPerdidos}d)` : ''}</td>
                  <td>{o.colaboradorId ? nomes.colaborador(d, o.colaboradorId) : '—'}</td><td>{o.local}</td><td>{o.cat || '—'}</td><td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="vazio-doc">Nenhuma ocorrência registrada no mês.</p>}

        <h4 className="secao-doc">3. Inspeções</h4>
        {insp.length ? (
          <table>
            <thead><tr><th>Data</th><th>Checklist</th><th>Local</th><th>Conformidade</th><th>Não conformidades</th><th>Status</th></tr></thead>
            <tbody>
              {insp.map((i) => {
                const r = resumo(i)
                return <tr key={i.id}><td>{fmtData(i.data)}</td><td>{i.titulo}</td><td>{i.local}</td><td>{r.conf === null ? '—' : r.conf + '%'}</td><td>{r.nc}</td><td>{i.status}</td></tr>
              })}
            </tbody>
          </table>
        ) : <p className="vazio-doc">Nenhuma inspeção realizada no mês.</p>}

        <h4 className="secao-doc">4. Treinamentos, exames e EPIs</h4>
        <div className="kpis-doc">
          <Kpi rotulo="Treinamentos" valor={treinos.length} sub={`${horasTreino} h`} />
          <Kpi rotulo="ASOs realizados" valor={asos.length} sub={`${asos.filter((a) => a.resultado !== 'Apto').length} com restrição/inapto`} />
          <Kpi rotulo="Entregas de EPI" valor={entregas.length} sub={`${entregas.reduce((s, e) => s + (Number(e.quantidade) || 0), 0)} unidades`} />
          <Kpi rotulo="Permissões de trabalho" valor={pts.length} />
        </div>
        {treinos.length > 0 && (
          <table>
            <thead><tr><th>Data</th><th>Colaborador</th><th>Curso</th><th>CH</th><th>Validade</th></tr></thead>
            <tbody>{treinos.map((t) => <tr key={t.id}><td>{fmtData(t.data)}</td><td>{nomes.colaborador(d, t.colaboradorId)}</td><td>{t.curso}</td><td>{t.cargaHoraria}h</td><td>{fmtData(t.validade)}</td></tr>)}</tbody>
          </table>
        )}

        <h4 className="secao-doc">5. DDS</h4>
        {dds.length ? (
          <>
            <p className="declaracao">{dds.length} diálogo(s) realizado(s), {dds.reduce((s, x) => s + (Number(x.participantes) || 0), 0)} participações e {dds.reduce((s, x) => s + (Number(x.duracao) || 0), 0)} minutos no total.</p>
            <table>
              <thead><tr><th>Data</th><th>Tema</th><th>Conduzido por</th><th>Participantes</th></tr></thead>
              <tbody>{[...dds].sort((a, b) => a.data.localeCompare(b.data)).map((x) => <tr key={x.id}><td>{fmtData(x.data)}</td><td>{x.tema}</td><td>{x.responsavel}</td><td>{x.participantes}</td></tr>)}</tbody>
            </table>
          </>
        ) : <p className="vazio-doc">Nenhum DDS registrado no mês.</p>}

        <h4 className="secao-doc">6. Plano de ação (situação atual)</h4>
        <p className="declaracao">{acoesPend.length} ação(ões) pendente(s), sendo {atrasadas.length} atrasada(s). {acoes.length - acoesPend.length} concluída(s) no total.</p>
        {acoesPend.length > 0 && (
          <table>
            <thead><tr><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead>
            <tbody>{acoesPend.slice(0, 15).map((a) => <tr key={a.id}><td>{a.oque}</td><td>{a.quem || '—'}</td><td>{fmtData(a.quando)}{a.quando < hoje() ? ' (atrasada)' : ''}</td><td>{a.status}</td></tr>)}</tbody>
          </table>
        )}

        <h4 className="secao-doc">7. Pendências de treinamentos e exames (situação atual)</h4>
        {pend.length ? (
          <table>
            <thead><tr><th>Colaborador</th><th>Pendência</th><th>Situação</th></tr></thead>
            <tbody>{pend.slice(0, 30).map((p, i) => <tr key={i}><td>{p.nome}</td><td>{p.item}</td><td>{p.situacao}</td></tr>)}</tbody>
          </table>
        ) : <p className="vazio-doc">Nenhuma pendência.</p>}

        {obs.trim() && (
          <>
            <h4 className="secao-doc">8. Observações</h4>
            <p className="declaracao" style={{ whiteSpace: 'pre-wrap' }}>{obs}</p>
          </>
        )}

        <div className="assinaturas">
          <div>{d.config.tecnico}<br />Técnico(a) de Segurança do Trabalho</div>
          <div>{empresa?.responsavel || 'Responsável pela empresa'}<br />Ciente</div>
        </div>
      </div>
    </>
  )
}

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: ReactNode; sub?: string }) {
  return (
    <div className="kpi-doc">
      <div className="r">{rotulo}</div>
      <div className="v">{valor}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  )
}

/** Treinamentos exigidos vencidos/faltando e ASOs vencidos dos colaboradores informados. */
function pendencias(d: DB, ids: string[]) {
  const out: { nome: string; item: string; situacao: string }[] = []
  for (const id of ids) {
    const c = d.colaboradores.find((x) => x.id === id)!
    const exigidos = cursosDaFuncao(d, c.funcao)
    for (const curso of exigidos) {
      const s = statusCurso(d, id, curso)
      if (s.st === 'falta') out.push({ nome: c.nome, item: curso, situacao: 'Sem o treinamento' })
      else if (s.st === 'vencido') out.push({ nome: c.nome, item: curso, situacao: `Vencido em ${fmtData(s.validade)}` })
    }
    // treinamentos vencidos fora da matriz (registro mais recente de cada curso)
    const ultimos = new Map<string, { validade: string; data: string }>()
    for (const t of d.treinamentos.filter((t) => t.colaboradorId === id)) {
      const a = ultimos.get(t.curso)
      if (!a || t.data > a.data) ultimos.set(t.curso, t)
    }
    for (const [curso, t] of ultimos) {
      if (exigidos.includes(curso)) continue
      if (t.validade && t.validade < hoje()) out.push({ nome: c.nome, item: curso, situacao: `Vencido em ${fmtData(t.validade)}` })
    }
    const aso = d.asos.filter((a) => a.colaboradorId === id && a.validade).sort((a, b) => b.data.localeCompare(a.data))[0]
    if (aso && aso.validade < hoje()) out.push({ nome: c.nome, item: 'ASO periódico', situacao: `Vencido em ${fmtData(aso.validade)}` })
  }
  return out
}
