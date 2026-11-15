// Avaliações ambientais (NR-9 / NR-15 / NHO): medições por GHE comparadas com o limite de tolerância e o nível de ação.
import { ArrowLeft, ListPlus, Printer } from 'lucide-react'
import { CrudPage, type CrudConfig, type Reg } from '../components/CrudPage'
import { BlocoAssinatura } from '../components/Assinatura'
import { CabecalhoDoc, Link, PageHead, Validade, toast } from '../components/ui'
import { AGENTES_AMBIENTAIS, classificarAvaliacao } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { Avaliacao, DB } from '../lib/types'
import { addDias, addMeses, fmtData, hoje, situacao } from '../lib/utils'

const num = (v: unknown) => Number(String(v ?? '').replace(',', '.'))
const fmtV = (v: unknown) => (v === '' || v == null || !isFinite(num(v)) ? '—' : num(v).toLocaleString('pt-BR', { maximumFractionDigits: num(v) < 1 ? 4 : 1 }))
export const classe = (a: Reg | Avaliacao) => classificarAvaliacao(a.resultado, a.limite, a.nivelAcao)

const ROTULO = { acima: 'Acima do limite', acao: 'Acima do nível de ação', ok: 'Abaixo do nível de ação' } as const
const COR = { acima: 'vencido', acao: 'avencer', ok: 'ok' } as const

export function BadgeAvaliacao({ a }: { a: Reg | Avaliacao }) {
  const c = classe(a)
  if (!c) return <span className="badge">Sem limite</span>
  return <span className={'badge ' + COR[c]}>{ROTULO[c]}</span>
}

const pctLimite = (a: Reg | Avaliacao) => {
  const l = num(a.limite)
  return l > 0 && isFinite(num(a.resultado)) ? Math.round((num(a.resultado) / l) * 100) : null
}

const ajudaDo = (agente: string) => AGENTES_AMBIENTAIS.find((x) => x.agente === agente)?.ajuda ?? ''

const cfg: CrudConfig = {
  colecao: 'avaliacoes',
  titulo: 'Avaliações ambientais',
  sub: 'Medições de ruído, calor, vibração, poeiras e químicos por GHE, comparadas com o limite de tolerância e o nível de ação (NR-9 / NR-15).',
  singular: 'Avaliação',
  feminino: true,
  escopo: 'empresa',
  campos: [
    { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref', ref: 'empresas', obrigatorio: true },
    { nome: 'ghe', rotulo: 'GHE', tipo: 'datalist', opcoes: (d) => [...new Set(d.avaliacoes.map((a) => a.ghe).filter(Boolean))], obrigatorio: true, placeholder: 'Ex.: GHE 01' },
    { nome: 'setor', rotulo: 'Setor', tipo: 'datalist', opcoes: (d) => [...new Set(d.colaboradores.map((c) => c.setor).filter(Boolean))] },
    { nome: 'funcoes', rotulo: 'Funções avaliadas', tipo: 'text' },
    { nome: 'agente', rotulo: 'Agente', tipo: 'select', opcoes: AGENTES_AMBIENTAIS.map((a) => a.agente), obrigatorio: true },
    { nome: 'descricaoAgente', rotulo: 'Descrição do agente', tipo: 'text', placeholder: 'Ex.: tolueno, fumos metálicos, sílica' },
    { nome: 'metodologia', rotulo: 'Metodologia', tipo: 'text', placeholder: 'Ex.: NHO-01' },
    { nome: 'data', rotulo: 'Data da avaliação', tipo: 'date', obrigatorio: true },
    { nome: 'resultado', rotulo: 'Resultado', tipo: 'text', obrigatorio: true, placeholder: 'Ex.: 87,4' },
    { nome: 'unidade', rotulo: 'Unidade', tipo: 'text' },
    { nome: 'limite', rotulo: 'Limite de tolerância', tipo: 'text', ajuda: 'Sugerido pelo agente; confira a norma aplicável' },
    { nome: 'nivelAcao', rotulo: 'Nível de ação', tipo: 'text', ajuda: 'Se vazio, usa metade do limite' },
    { nome: 'equipamento', rotulo: 'Equipamento (nº de série / calibração)', tipo: 'text', full: true },
    { nome: 'responsavel', rotulo: 'Responsável pela avaliação', tipo: 'text' },
    { nome: 'proximaAvaliacao', rotulo: 'Próxima avaliação', tipo: 'date' },
    { nome: 'obs', rotulo: 'Observações / medidas de controle', tipo: 'textarea', full: true },
  ],
  padroes: (d) => {
    const a = AGENTES_AMBIENTAIS[0]
    return { agente: a.agente, unidade: a.unidade, limite: a.limite, nivelAcao: a.nivelAcao, metodologia: a.metodologia, data: hoje(), proximaAvaliacao: addMeses(hoje(), 12), responsavel: d.config.tecnico }
  },
  derivar: (v, campo) => {
    if (campo === 'agente') {
      const a = AGENTES_AMBIENTAIS.find((x) => x.agente === v.agente)
      return a ? { unidade: a.unidade, limite: a.limite, nivelAcao: a.nivelAcao, metodologia: a.metodologia || v.metodologia } : {}
    }
    if (campo === 'data' && v.data) return { proximaAvaliacao: addMeses(v.data, 12) }
    return {}
  },
  colunas: [
    { rotulo: 'GHE / setor', texto: (r, d) => `${r.ghe} ${r.setor} ${r.funcoes} ${nomes.empresa(d, r.empresaId)}`, render: (r) => <div><strong>{r.ghe}</strong><span className="sub">{[r.setor, r.funcoes].filter(Boolean).join(' · ')}</span></div> },
    { rotulo: 'Agente', texto: (r) => `${r.agente} ${r.descricaoAgente}`, render: (r) => <div>{r.agente}{r.descricaoAgente && <span className="sub">{r.descricaoAgente}</span>}</div> },
    {
      rotulo: 'Resultado',
      texto: (r) => `${r.resultado} ${r.unidade}`,
      render: (r) => {
        const p = pctLimite(r)
        return (
          <div style={{ display: 'grid', gap: 4 }}>
            <div><strong>{fmtV(r.resultado)}</strong> {r.unidade}<span className="sub">Limite {fmtV(r.limite)}{p !== null ? ` · ${p}% do limite` : ''}</span></div>
            <div><BadgeAvaliacao a={r} /></div>
          </div>
        )
      },
    },
    { rotulo: 'Avaliado em', texto: (r) => fmtData(r.data), esconderMobile: true },
    { rotulo: 'Próxima', texto: (r) => fmtData(r.proximaAvaliacao), render: (r, d) => <Validade iso={r.proximaAvaliacao} alerta={d.config.alertaDias} /> },
  ],
  filtros: [
    { rotulo: 'Acima do limite', teste: (r) => classe(r) === 'acima' },
    { rotulo: 'Acima do nível de ação', teste: (r) => classe(r) === 'acao' },
    { rotulo: 'Reavaliação vencida', teste: (r, d) => situacao(r.proximaAvaliacao, d.config.alertaDias) === 'vencido' },
  ],
  ordenar: (a, b) => String(a.ghe).localeCompare(String(b.ghe), 'pt-BR', { numeric: true }) || a.agente.localeCompare(b.agente),
  acoesExtras: (r) => {
    const c = classe(r)
    if (c !== 'acima' && c !== 'acao') return null
    return (
      <button className="btn btn-sm" disabled={r.acaoGerada} onClick={() => gerarAcao(r as Avaliacao)} title="Criar ação de controle no plano de ação">
        <ListPlus size={14} /> {r.acaoGerada ? 'Ação criada' : 'Gerar ação'}
      </button>
    )
  },
  botoesExtras: (
    <Link to="/app/avaliacoes/imprimir" className="btn">
      <Printer size={16} /> Imprimir quadro
    </Link>
  ),
  cabecalhoExtra: <Resumo />,
}

function gerarAcao(a: Avaliacao) {
  const acima = classe(a) === 'acima'
  db.adicionar('acoes', {
    empresaId: a.empresaId,
    oque: acima
      ? `${a.agente}${a.descricaoAgente ? ` (${a.descricaoAgente})` : ''} acima do limite no ${a.ghe}: implantar controle na fonte/trajetória e garantir EPI adequado`
      : `${a.agente}${a.descricaoAgente ? ` (${a.descricaoAgente})` : ''} acima do nível de ação no ${a.ghe}: medidas preventivas e monitoramento periódico`,
    porque: `Avaliação de ${fmtData(a.data)}: ${fmtV(a.resultado)} ${a.unidade} (limite ${fmtV(a.limite)})`,
    onde: a.setor,
    quem: '',
    quando: addDias(hoje(), acima ? 30 : 60),
    como: '',
    quanto: '',
    prioridade: acima ? 'Alta' : 'Média',
    status: 'Aberta',
    origem: 'Avaliação ambiental',
  })
  db.atualizar('avaliacoes', a.id, { acaoGerada: true })
  toast('Ação criada no plano de ação')
}

function Resumo() {
  const d = useDB()
  const l = daEmpresaAtiva(d, d.avaliacoes)
  const n = (c: string) => l.filter((a) => classe(a) === c).length
  const vencidas = l.filter((a) => situacao(a.proximaAvaliacao, d.config.alertaDias) === 'vencido').length
  const ghes = new Set(l.map((a) => a.empresaId + a.ghe)).size
  return (
    <div className="grid grid-4" style={{ marginBottom: 16 }}>
      <div className="card stat"><div className="rotulo">Avaliações</div><div className="valor">{l.length}</div><div className="detalhe">em {ghes} GHE(s)</div></div>
      <div className="card stat"><div className="rotulo">Acima do limite</div><div className="valor" style={n('acima') ? { color: 'var(--danger)' } : undefined}>{n('acima')}</div><div className="detalhe">exige controle imediato</div></div>
      <div className="card stat"><div className="rotulo">Acima do nível de ação</div><div className="valor" style={n('acao') ? { color: 'var(--warn)' } : undefined}>{n('acao')}</div><div className="detalhe">medidas preventivas (NR-9)</div></div>
      <div className="card stat"><div className="rotulo">Reavaliações vencidas</div><div className="valor">{vencidas}</div><div className="detalhe">refazer a medição</div></div>
    </div>
  )
}

export default function Avaliacoes() {
  return <CrudPage cfg={cfg} />
}

/** Quadro de avaliações ambientais para impressão (anexo do PGR / LTCAT). */
export function ImprimirAvaliacoes() {
  const d = useDB()
  const empresa = d.empresas.find((e) => e.id === d.config.empresaAtiva)
  const lista = [...daEmpresaAtiva(d, d.avaliacoes)].sort((a, b) => a.empresaId.localeCompare(b.empresaId) || a.ghe.localeCompare(b.ghe, 'pt-BR', { numeric: true }) || a.agente.localeCompare(b.agente))
  const ghes = [...new Set(lista.map((a) => a.empresaId + '|' + a.ghe))]
  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/avaliacoes"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Avaliações ambientais</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo="Imprimir avaliações ambientais" sub={empresa ? empresa.nome : 'Todas as empresas — escolha uma empresa no topo para imprimir só a dela'}>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>
      </div>
      <div className="doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>QUADRO DE AVALIAÇÕES AMBIENTAIS</h2>
        <div className="sub-doc">Agentes físicos, químicos e biológicos – NR-9 / NR-15</div>
        <div className="info">
          <div><b>Empresa:</b> {empresa?.nome ?? 'Todas as empresas'}</div>
          <div><b>CNPJ:</b> {empresa?.cnpj ?? '—'}</div>
          <div><b>Emitido em:</b> {fmtData(hoje())}</div>
          <div><b>Responsável:</b> {d.config.tecnico}{d.config.registro ? ` – ${d.config.registro}` : ''}</div>
        </div>
        {ghes.length === 0 && <p className="vazio-doc">Nenhuma avaliação cadastrada.</p>}
        {ghes.map((g) => {
          const doGhe = lista.filter((a) => a.empresaId + '|' + a.ghe === g)
          return (
            <div key={g}>
              <h4 className="secao-doc">{!empresa && `${nomes.empresa(d, doGhe[0].empresaId)} · `}{doGhe[0].ghe}{doGhe[0].setor ? ` – ${doGhe[0].setor}` : ''}{doGhe[0].funcoes ? ` (${doGhe[0].funcoes})` : ''}</h4>
              <table>
                <thead><tr><th>Agente</th><th>Metodologia</th><th>Data</th><th>Resultado</th><th>Nível de ação</th><th>Limite</th><th>Situação</th><th>Observações</th></tr></thead>
                <tbody>
                  {doGhe.map((a) => {
                    const c = classe(a)
                    return (
                      <tr key={a.id}>
                        <td>{a.agente}{a.descricaoAgente ? ` – ${a.descricaoAgente}` : ''}</td>
                        <td>{a.metodologia}</td>
                        <td>{fmtData(a.data)}</td>
                        <td><b>{fmtV(a.resultado)}</b> {a.unidade}</td>
                        <td>{fmtV(a.nivelAcao)}</td>
                        <td>{fmtV(a.limite)}</td>
                        <td>{c ? ROTULO[c] : 'Sem limite'}</td>
                        <td>{a.obs}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
        <p className="nota">Abaixo do nível de ação: manter monitoramento. Acima do nível de ação: medidas preventivas para que o limite não seja ultrapassado (NR-9). Acima do limite: medidas de controle imediatas. {ajudaDo('Ruído')}.</p>
        <div className="assinaturas">
          <BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}{d.config.registro ? ` – ${d.config.registro}` : ''}<br />Responsável técnico</BlocoAssinatura>
          <div>{empresa?.responsavel || 'Responsável pela organização'}<br />Organização</div>
        </div>
      </div>
    </>
  )
}

export const avaliacoesPendentes = (d: DB) => daEmpresaAtiva(d, d.avaliacoes).filter((a) => classe(a) === 'acima' || situacao(a.proximaAvaliacao, d.config.alertaDias) === 'vencido').length
