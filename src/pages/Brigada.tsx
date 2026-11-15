// Brigada de emergência e simulados (NR-23 / instruções técnicas do Corpo de Bombeiros).
import { ArrowLeft, FileText, ListPlus, Printer } from 'lucide-react'
import { BlocoAssinatura } from '../components/Assinatura'
import { CrudPage, type CrudConfig } from '../components/CrudPage'
import { CabecalhoDoc, Link, PageHead, Vazio, toast } from '../components/ui'
import { TIPOS_SIMULADO } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { Simulado } from '../lib/types'
import { addDias, fmtData, hoje } from '../lib/utils'
import { statusCurso } from './Matriz'

export const CURSO_BRIGADA = 'NR-23 Brigada de incêndio'
const ROT = { ok: 'Em dia', avencer: 'A vencer', vencido: 'Vencido', falta: 'Sem treinamento' }
const CLS = { ok: 'ok', avencer: 'avencer', vencido: 'vencido', falta: 'vencido' }

/** "mm:ss" → segundos */
const seg = (t: string) => {
  const [m, s] = t.split(':').map(Number)
  return isFinite(m) ? m * 60 + (s || 0) : NaN
}

/* ---------- Brigadistas ---------- */
const cfgBrigada: CrudConfig = {
  colecao: 'brigadistas',
  titulo: 'Brigada de emergência',
  sub: 'Brigadistas por setor e turno, com a situação do treinamento de brigada (curso NR-23 nos Treinamentos).',
  singular: 'Brigadista',
  escopo: 'colaborador',
  campos: [
    { nome: 'colaboradorId', rotulo: 'Colaborador', tipo: 'ref', ref: 'colaboradores', obrigatorio: true, full: true },
    { nome: 'funcao', rotulo: 'Função na brigada', tipo: 'select', opcoes: ['Coordenador geral', 'Chefe da brigada', 'Líder', 'Brigadista'], obrigatorio: true },
    { nome: 'turno', rotulo: 'Turno', tipo: 'datalist', opcoes: ['Comercial', '1º turno', '2º turno', '3º turno'] },
    { nome: 'setor', rotulo: 'Setor / área de atuação', tipo: 'datalist', opcoes: (d) => [...new Set(d.colaboradores.map((c) => c.setor).filter(Boolean))] },
  ],
  padroes: () => ({ funcao: 'Brigadista', turno: 'Comercial' }),
  derivar: (v, campo, d) => {
    if (campo !== 'colaboradorId' || v.setor) return {}
    const c = d.colaboradores.find((x) => x.id === v.colaboradorId)
    return c ? { setor: c.setor } : {}
  },
  colunas: [
    { rotulo: 'Brigadista', texto: (r, d) => nomes.colaborador(d, r.colaboradorId), render: (r, d) => { const c = d.colaboradores.find((x) => x.id === r.colaboradorId); return <div><strong>{c?.nome ?? '—'}</strong><span className="sub">{c?.funcao}</span></div> } },
    { rotulo: 'Função', texto: (r) => r.funcao },
    { rotulo: 'Setor / turno', texto: (r) => `${r.setor} ${r.turno}`, render: (r) => <div>{r.setor || '—'}<span className="sub">{r.turno}</span></div> },
    {
      rotulo: 'Treinamento',
      texto: (r, d) => ROT[statusCurso(d, r.colaboradorId, CURSO_BRIGADA).st],
      render: (r, d) => { const s = statusCurso(d, r.colaboradorId, CURSO_BRIGADA); return <div><span className={'badge ' + CLS[s.st]}>{ROT[s.st]}</span>{s.validade && <span className="sub">{fmtData(s.validade)}</span>}</div> },
    },
  ],
  filtros: [
    { rotulo: 'Treinamento pendente', teste: (r, d) => ['vencido', 'falta'].includes(statusCurso(d, r.colaboradorId, CURSO_BRIGADA).st) },
  ],
  ordenar: (a, b) => String(a.setor).localeCompare(String(b.setor)),
  cabecalhoExtra: <ResumoBrigada />,
}

function ResumoBrigada() {
  const d = useDB()
  const lista = daEmpresaAtiva(d, d.brigadistas)
  const emDia = lista.filter((b) => ['ok', 'avencer'].includes(statusCurso(d, b.colaboradorId, CURSO_BRIGADA).st)).length
  const porSetor = new Map<string, number>()
  for (const b of lista) porSetor.set(b.setor || 'Sem setor', (porSetor.get(b.setor || 'Sem setor') ?? 0) + 1)
  const ultimo = [...daEmpresaAtiva(d, d.simulados)].sort((a, b) => b.data.localeCompare(a.data))[0]
  return (
    <div className="grid grid-3" style={{ marginBottom: 16 }}>
      <div className="card stat"><div className="rotulo">Brigadistas</div><div className="valor">{lista.length}</div><div className="detalhe">{[...porSetor].map(([s, n]) => `${s}: ${n}`).join(' · ') || '—'}</div></div>
      <div className="card stat"><div className="rotulo">Treinamento em dia</div><div className="valor" style={{ color: emDia < lista.length ? 'var(--danger)' : 'var(--ok)' }}>{emDia}/{lista.length}</div><div className="detalhe">curso “{CURSO_BRIGADA}”</div></div>
      <Link to="/app/simulados" className="card stat"><div className="rotulo">Último simulado</div><div className="valor" style={{ fontSize: 22 }}>{ultimo ? fmtData(ultimo.data) : '—'}</div><div className="detalhe">{ultimo ? ultimo.tipo : 'Nenhum registrado'}</div></Link>
    </div>
  )
}

export function Brigada() {
  return <CrudPage cfg={cfgBrigada} />
}

/* ---------- Simulados ---------- */
const cfgSimulados: CrudConfig = {
  colecao: 'simulados',
  titulo: 'Simulados de emergência',
  sub: 'Abandono de área, combate a princípio de incêndio, primeiros socorros e resgates: tempos, participação, pontos de melhoria e relatório.',
  singular: 'Simulado',
  escopo: 'empresa',
  campos: [
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_SIMULADO, obrigatorio: true },
    { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref', ref: 'empresas', obrigatorio: true },
    { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true },
    { nome: 'local', rotulo: 'Local / área', tipo: 'text' },
    { nome: 'cenario', rotulo: 'Cenário simulado', tipo: 'text', full: true },
    { nome: 'participantes', rotulo: 'Participantes', tipo: 'number' },
    { nome: 'pontoEncontro', rotulo: 'Ponto de encontro', tipo: 'text' },
    { nome: 'tempoAbandono', rotulo: 'Tempo de abandono (mm:ss)', tipo: 'text', placeholder: '03:45' },
    { nome: 'metaTempo', rotulo: 'Meta de tempo (mm:ss)', tipo: 'text', placeholder: '03:00' },
    { nome: 'responsavel', rotulo: 'Coordenado por', tipo: 'text' },
    { nome: 'pontosPositivos', rotulo: 'Pontos positivos', tipo: 'textarea' },
    { nome: 'pontosMelhoria', rotulo: 'Pontos de melhoria', tipo: 'textarea', ajuda: 'Cada linha vira uma ação ao clicar em “Gerar ações”' },
  ],
  padroes: (d) => ({ tipo: 'Abandono de área', responsavel: d.config.tecnico }),
  colunas: [
    { rotulo: 'Data', texto: (r) => fmtData(r.data) },
    { rotulo: 'Simulado', texto: (r) => `${r.tipo} ${r.cenario}`, render: (r, d) => <div><strong>{r.tipo}</strong><span className="sub">{r.cenario} · {nomes.empresa(d, r.empresaId)}</span></div> },
    { rotulo: 'Participantes', texto: (r) => String(r.participantes ?? ''), esconderMobile: true },
    {
      rotulo: 'Tempo',
      texto: (r) => r.tempoAbandono,
      render: (r) => {
        if (!r.tempoAbandono) return '—'
        const ok = r.metaTempo ? seg(r.tempoAbandono) <= seg(r.metaTempo) : null
        return <div>{r.tempoAbandono}{r.metaTempo && <span className={'badge ' + (ok ? 'ok' : 'vencido')} style={{ marginLeft: 6 }}>{ok ? 'na meta' : `meta ${r.metaTempo}`}</span>}</div>
      },
    },
  ],
  ordenar: (a, b) => b.data.localeCompare(a.data),
  acoesExtras: (r) => (
    <>
      <Link to={'/app/simulados/' + r.id} className="btn btn-sm"><FileText size={14} /> Relatório</Link>
      <button className="btn btn-sm" disabled={r.acoesGeradas || !String(r.pontosMelhoria || '').trim()} onClick={() => gerarAcoes(r as Simulado)} title="Cria ações a partir dos pontos de melhoria">
        <ListPlus size={14} /> {r.acoesGeradas ? 'Ações criadas' : 'Gerar ações'}
      </button>
    </>
  ),
}

function gerarAcoes(s: Simulado) {
  const itens = s.pontosMelhoria.split(/\n|;/).map((x) => x.trim()).filter(Boolean)
  for (const it of itens) {
    db.adicionar('acoes', {
      empresaId: s.empresaId, oque: it, porque: `Ponto de melhoria do simulado de ${s.tipo.toLowerCase()} (${fmtData(s.data)})`,
      onde: s.local, quem: '', quando: addDias(hoje(), 30), como: '', quanto: '', prioridade: 'Média', status: 'Aberta', origem: 'Simulado de emergência',
    })
  }
  db.atualizar('simulados', s.id, { acoesGeradas: true })
  toast(`${itens.length} ação(ões) criada(s) no plano de ação`)
}

export function Simulados() {
  return <CrudPage cfg={cfgSimulados} />
}

export function RelatorioSimulado({ id }: { id: string }) {
  const d = useDB()
  const s = d.simulados.find((x) => x.id === id)
  if (!s) return <Vazio texto="Simulado não encontrado."><Link to="/app/simulados">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === s.empresaId)
  const brig = d.brigadistas.filter((b) => d.colaboradores.find((c) => c.id === b.colaboradorId)?.empresaId === s.empresaId)
  const naMeta = s.tempoAbandono && s.metaTempo ? seg(s.tempoAbandono) <= seg(s.metaTempo) : null
  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/simulados"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Simulados</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`Relatório do simulado · ${s.tipo}`} sub={`${empresa?.nome ?? '—'} · ${fmtData(s.data)}`}>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>
      </div>
      <div className="doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>RELATÓRIO DE SIMULADO DE EMERGÊNCIA</h2>
        <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj}</div>
        <div className="info">
          <div><b>Tipo:</b> {s.tipo}</div>
          <div><b>Data:</b> {fmtData(s.data)}</div>
          <div><b>Local:</b> {s.local || '—'}</div>
          <div><b>Participantes:</b> {s.participantes || '—'}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>Cenário:</b> {s.cenario}</div>
          {s.pontoEncontro && <div><b>Ponto de encontro:</b> {s.pontoEncontro}</div>}
          {s.tempoAbandono && <div><b>Tempo de abandono:</b> {s.tempoAbandono}{s.metaTempo ? ` (meta ${s.metaTempo} – ${naMeta ? 'atingida' : 'não atingida'})` : ''}</div>}
        </div>
        <h4 className="secao-doc">Pontos positivos</h4>
        <p className="declaracao" style={{ whiteSpace: 'pre-wrap' }}>{s.pontosPositivos || '—'}</p>
        <h4 className="secao-doc">Pontos de melhoria</h4>
        <p className="declaracao" style={{ whiteSpace: 'pre-wrap' }}>{s.pontosMelhoria || '—'}</p>
        {brig.length > 0 && (
          <>
            <h4 className="secao-doc">Brigada de emergência</h4>
            <table>
              <thead><tr><th>Brigadista</th><th>Função</th><th>Setor / turno</th></tr></thead>
              <tbody>{brig.map((b) => <tr key={b.id}><td>{nomes.colaborador(d, b.colaboradorId)}</td><td>{b.funcao}</td><td>{b.setor} · {b.turno}</td></tr>)}</tbody>
            </table>
          </>
        )}
        <div className="assinaturas">
          <BlocoAssinatura imagem={s.responsavel === d.config.tecnico ? d.config.assinatura : undefined}>{s.responsavel}<br />Coordenação do simulado</BlocoAssinatura>
          <div>{empresa?.responsavel || 'Responsável pela empresa'}<br />Ciente</div>
        </div>
      </div>
    </>
  )
}
