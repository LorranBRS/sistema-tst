import { AlertTriangle, ClipboardCheck, GraduationCap, HardHat, ListTodo, Stethoscope, Users } from 'lucide-react'
import { BadgeSituacao, Link, PageHead, Stat } from '../components/ui'
import { TIPOS_ACIDENTE } from '../lib/catalogos'
import { daEmpresaAtiva, nomes, useDB } from '../lib/store'
import { pendenciasMatriz } from './Matriz'
import { addMeses, diasAte, fmtData, hoje, MESES_CURTOS, situacao, textoPrazo } from '../lib/utils'

interface Vencimento {
  tipo: string
  titulo: string
  sub: string
  data: string
  rota: string
}

export default function Painel() {
  const d = useDB()
  const alerta = d.config.alertaDias
  const colabs = daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado')
  const idsColabs = new Set(colabs.map((c) => c.id))
  const doColab = <T extends { colaboradorId: string }>(l: T[]) => l.filter((r) => idsColabs.has(r.colaboradorId))

  // Considera só o registro mais recente por colaborador+curso (reciclagens substituem o anterior)
  const treinos = ultimos(doColab(d.treinamentos), (t) => t.colaboradorId + '|' + t.curso)
  const asos = ultimos(doColab(d.asos).filter((a) => a.validade), (a) => a.colaboradorId)
  const ocorr = daEmpresaAtiva(d, d.ocorrencias)
  const acoes = daEmpresaAtiva(d, d.acoes)
  const insp = daEmpresaAtiva(d, d.inspecoes)

  const contar = <T,>(l: T[], campo: (x: T) => string) => ({
    vencidos: l.filter((x) => situacao(campo(x), alerta) === 'vencido').length,
    aVencer: l.filter((x) => situacao(campo(x), alerta) === 'avencer').length,
  })
  const tr = contar(treinos, (t) => t.validade)
  const faltaMatriz = pendenciasMatriz(d)
  const as = contar(asos, (a) => a.validade)
  const caProb = d.epis.filter((e) => situacao(e.validadeCa, alerta) !== 'ok').length
  const estoqueBaixo = d.epis.filter((e) => e.estoque <= e.estoqueMinimo).length
  const acoesAbertas = acoes.filter((a) => a.status !== 'Concluída')
  const atrasadas = acoesAbertas.filter((a) => diasAte(a.quando) < 0)

  const acidentes = ocorr.filter((o) => TIPOS_ACIDENTE.includes(o.tipo)).sort((a, b) => b.data.localeCompare(a.data))
  const diasSem = acidentes.length ? -diasAte(acidentes[0].data) : null
  const recorde = calcularRecorde(acidentes.map((a) => a.data))

  const concluidas = insp.filter((i) => i.status === 'Concluída')
  const conf = concluidas.length
    ? Math.round(
        (concluidas.reduce((s, i) => {
          const c = i.itens.filter((x) => x.resposta === 'C').length
          const nc = i.itens.filter((x) => x.resposta === 'NC').length
          return s + (c + nc ? c / (c + nc) : 1)
        }, 0) /
          concluidas.length) *
          100,
      )
    : null

  // Próximos vencimentos (todas as fontes)
  const venc: Vencimento[] = [
    ...treinos.filter((t) => situacao(t.validade, alerta) !== 'ok' && t.validade).map((t) => ({ tipo: 'Treinamento', titulo: t.curso, sub: nomes.colaborador(d, t.colaboradorId), data: t.validade, rota: '/app/treinamentos' })),
    ...asos.filter((a) => situacao(a.validade, alerta) !== 'ok').map((a) => ({ tipo: 'ASO', titulo: 'Exame periódico', sub: nomes.colaborador(d, a.colaboradorId), data: a.validade, rota: '/app/asos' })),
    ...d.epis.filter((e) => e.validadeCa && situacao(e.validadeCa, alerta) !== 'ok').map((e) => ({ tipo: 'CA de EPI', titulo: `${e.nome}`, sub: `CA ${e.ca}`, data: e.validadeCa, rota: '/app/epis' })),
    ...doColab(d.entregas).filter((e) => situacao(e.proximaTroca, 7) !== 'ok').map((e) => ({ tipo: 'Troca de EPI', titulo: nomes.epi(d, e.epiId), sub: nomes.colaborador(d, e.colaboradorId), data: e.proximaTroca, rota: '/app/entregas' })),
  ].sort((a, b) => a.data.localeCompare(b.data))

  // Ocorrências por mês (últimos 12 meses)
  const inicio = addMeses(hoje().slice(0, 8) + '01', -11)
  const meses = Array.from({ length: 12 }, (_, i) => addMeses(inicio, i).slice(0, 7))
  const porMes = meses.map((m) => ({ m, n: ocorr.filter((o) => o.data.startsWith(m)).length, ac: ocorr.filter((o) => o.data.startsWith(m) && TIPOS_ACIDENTE.includes(o.tipo)).length }))
  const max = Math.max(1, ...porMes.map((x) => x.n))

  const empresaNome = d.config.empresaAtiva ? nomes.empresa(d, d.config.empresaAtiva) : 'todas as empresas'

  return (
    <>
      <PageHead titulo={`Olá, ${d.config.tecnico.split(' ')[0]}`} sub={`Visão geral de ${empresaNome} · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`} />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card destaque-dias" style={{ gridColumn: 'span 1' }}>
          <div className="num">{diasSem ?? '—'}</div>
          <div>
            <strong>dias sem acidentes</strong>
            <p>{acidentes.length ? `Último em ${fmtData(acidentes[0].data)}` : 'Nenhum acidente registrado'}{recorde ? ` · recorde ${recorde} dias` : ''}</p>
          </div>
        </div>
        <Stat rotulo="Colaboradores ativos" valor={colabs.filter((c) => c.status === 'Ativo').length} detalhe={`${colabs.filter((c) => c.status === 'Afastado').length} afastado(s)`} icone={<Users size={16} />} to="/app/colaboradores" />
        <Stat rotulo="Conformidade das inspeções" valor={conf === null ? '—' : conf + '%'} detalhe={`${concluidas.length} inspeção(ões) concluída(s)`} icone={<ClipboardCheck size={16} />} tom="info" to="/app/inspecoes" />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Stat rotulo="Treinamentos" valor={tr.vencidos} detalhe={<><b style={{ color: 'var(--danger)' }}>vencidos</b> · {tr.aVencer} a vencer{faltaMatriz ? ` · ${faltaMatriz} pendente(s) na matriz` : ''}</>} icone={<GraduationCap size={16} />} tom={tr.vencidos ? 'danger' : undefined} to="/app/treinamentos" />
        <Stat rotulo="ASOs" valor={as.vencidos} detalhe={<><b style={{ color: 'var(--danger)' }}>vencidos</b> · {as.aVencer} a vencer</>} icone={<Stethoscope size={16} />} tom={as.vencidos ? 'danger' : undefined} to="/app/asos" />
        <Stat rotulo="EPIs com alerta" valor={caProb + estoqueBaixo} detalhe={`${caProb} CA vencendo · ${estoqueBaixo} estoque baixo`} icone={<HardHat size={16} />} tom={caProb + estoqueBaixo ? 'warn' : undefined} to="/app/epis" />
        <Stat rotulo="Ações pendentes" valor={acoesAbertas.length} detalhe={<><b style={{ color: atrasadas.length ? 'var(--danger)' : undefined }}>{atrasadas.length} atrasada(s)</b></>} icone={<ListTodo size={16} />} tom={atrasadas.length ? 'danger' : 'info'} to="/app/acoes" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <AlertTriangle size={17} color="var(--warn)" />
            <h3>Vencimentos e pendências</h3>
            <span className="badge">{venc.length}</span>
          </div>
          {venc.length === 0 ? (
            <div className="vazio">Tudo em dia nos próximos {alerta} dias. 👏</div>
          ) : (
            <ul className="lista" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {venc.slice(0, 40).map((v, i) => (
                <li key={i}>
                  <div style={{ minWidth: 0 }}>
                    <div className="titulo">{v.titulo}</div>
                    <div className="sub">
                      {v.tipo} · {v.sub}
                    </div>
                  </div>
                  <div className="dir">
                    <Link to={v.rota}>
                      <BadgeSituacao iso={v.data} alerta={v.tipo === 'Troca de EPI' ? 7 : alerta} />
                    </Link>
                    <div className="sub">{textoPrazo(v.data)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <h3>Ocorrências nos últimos 12 meses</h3>
              <Link to="/app/ocorrencias" className="link">
                Ver todas
              </Link>
            </div>
            <div className="card-pad">
              <div className="barras" role="img" aria-label="Gráfico de ocorrências por mês">
                {porMes.map((x) => (
                  <div className="barra-col" key={x.m} title={`${x.n} ocorrência(s), ${x.ac} acidente(s)`}>
                    <span className="v">{x.n || ''}</span>
                    <div className={'barra' + (x.n ? '' : ' zero')} style={{ height: `${(x.n / max) * 100}%`, background: x.ac ? 'var(--danger)' : undefined }} />
                    <span className="lbl">{MESES_CURTOS[Number(x.m.slice(5)) - 1]}</span>
                  </div>
                ))}
              </div>
              <div className="nota">
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--danger)', marginRight: 5 }} />
                mês com acidente
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--primary)', margin: '0 5px 0 14px' }} />
                só incidentes / quase acidentes
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Ações atrasadas ou próximas</h3>
              <Link to="/app/acoes" className="link">
                Plano de ação
              </Link>
            </div>
            {acoesAbertas.length === 0 ? (
              <div className="vazio">Nenhuma ação pendente.</div>
            ) : (
              <ul className="lista">
                {[...acoesAbertas]
                  .sort((a, b) => a.quando.localeCompare(b.quando))
                  .slice(0, 5)
                  .map((a) => (
                    <li key={a.id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="titulo">{a.oque}</div>
                        <div className="sub">
                          {a.quem} · {a.status}
                        </div>
                      </div>
                      <div className="dir">
                        <span className={'badge ' + (diasAte(a.quando) < 0 ? 'vencido' : diasAte(a.quando) <= 7 ? 'avencer' : '')}>{fmtData(a.quando)}</span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ultimos<T extends { data: string }>(lista: T[], chave: (x: T) => string): T[] {
  const m = new Map<string, T>()
  for (const x of lista) {
    const k = chave(x)
    const atual = m.get(k)
    if (!atual || x.data > atual.data) m.set(k, x)
  }
  return [...m.values()]
}

function calcularRecorde(datas: string[]) {
  if (datas.length < 2) return null
  const ord = [...datas].sort()
  let rec = 0
  for (let i = 1; i < ord.length; i++) rec = Math.max(rec, diasAte(ord[i]) - diasAte(ord[i - 1]))
  rec = Math.max(rec, -diasAte(ord[ord.length - 1]))
  return rec
}
