// Inventário de riscos do PGR (NR-1): perigos por setor/função, avaliação P×S e plano de ação.
import { ArrowLeft, ListPlus, Printer } from 'lucide-react'
import { BlocoAssinatura } from '../components/Assinatura'
import { CrudPage, type CrudConfig, type Reg } from '../components/CrudPage'
import { CabecalhoDoc, Link, PageHead, toast } from '../components/ui'
import { CORES_RISCO, ESCALA_PROB, ESCALA_SEV, TIPOS_RISCO, nivelRisco } from '../lib/catalogos'
import { daEmpresaAtiva, db, useDB } from '../lib/store'
import type { Risco } from '../lib/types'
import { addDias, fmtData, hoje } from '../lib/utils'

export const nivelDe = (r: Pick<Risco, 'probabilidade' | 'severidade'>) => nivelRisco(parseInt(r.probabilidade) || 1, parseInt(r.severidade) || 1)

const cfg: CrudConfig = {
  colecao: 'riscos',
  titulo: 'Inventário de riscos (PGR)',
  sub: 'Identificação de perigos e avaliação dos riscos ocupacionais por setor e função (NR-1), com as medidas de prevenção.',
  singular: 'Risco',
  escopo: 'empresa',
  campos: [
    { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref', ref: 'empresas', obrigatorio: true },
    { nome: 'setor', rotulo: 'Setor / GHE', tipo: 'datalist', opcoes: (d) => [...new Set(d.colaboradores.map((c) => c.setor).filter(Boolean))], obrigatorio: true },
    { nome: 'funcoes', rotulo: 'Funções expostas', tipo: 'text', full: true, placeholder: 'Ex.: Soldador, Auxiliar de produção' },
    { nome: 'atividade', rotulo: 'Atividade', tipo: 'text', full: true },
    { nome: 'tipo', rotulo: 'Tipo de risco', tipo: 'select', opcoes: TIPOS_RISCO, obrigatorio: true },
    { nome: 'perigo', rotulo: 'Perigo / fator de risco', tipo: 'text', obrigatorio: true },
    { nome: 'fonte', rotulo: 'Fonte ou circunstância', tipo: 'text' },
    { nome: 'lesoes', rotulo: 'Possíveis lesões ou agravos', tipo: 'text' },
    { nome: 'expostos', rotulo: 'Nº de expostos', tipo: 'number' },
    { nome: 'probabilidade', rotulo: 'Probabilidade', tipo: 'select', opcoes: ESCALA_PROB, obrigatorio: true },
    { nome: 'severidade', rotulo: 'Severidade', tipo: 'select', opcoes: ESCALA_SEV, obrigatorio: true },
    { nome: 'medidasExistentes', rotulo: 'Medidas de prevenção existentes', tipo: 'textarea' },
    { nome: 'medidasPropostas', rotulo: 'Medidas propostas (plano de ação)', tipo: 'textarea' },
    { nome: 'responsavel', rotulo: 'Responsável', tipo: 'text' },
    { nome: 'prazo', rotulo: 'Prazo', tipo: 'date' },
  ],
  padroes: () => ({ tipo: 'Acidente', probabilidade: ESCALA_PROB[0], severidade: ESCALA_SEV[0], expostos: 1 }),
  colunas: [
    { rotulo: 'Setor', texto: (r) => `${r.setor} ${r.funcoes}`, render: (r) => <div><strong>{r.setor}</strong><span className="sub">{r.funcoes}</span></div> },
    {
      rotulo: 'Perigo',
      texto: (r) => `${r.tipo} ${r.perigo} ${r.fonte}`,
      render: (r) => (
        <div>
          <span className="badge" style={{ background: CORES_RISCO[r.tipo] + '22', color: CORES_RISCO[r.tipo], borderColor: 'transparent' }}>{r.tipo}</span>{' '}
          {r.perigo}
          <span className="sub">{r.fonte}</span>
        </div>
      ),
    },
    { rotulo: 'Expostos', texto: (r) => String(r.expostos ?? ''), esconderMobile: true },
    {
      rotulo: 'Nível',
      texto: (r) => nivelDe(r as Risco).nome,
      render: (r) => { const n = nivelDe(r as Risco); return <span className={'risco ' + n.cls}>{n.nome} ({n.valor})</span> },
    },
    { rotulo: 'Medidas propostas', texto: (r) => r.medidasPropostas, esconderMobile: true },
  ],
  filtros: [
    { rotulo: 'Crítico/alto', teste: (r) => nivelDe(r as Risco).valor >= 10 },
    ...TIPOS_RISCO.map((t) => ({ rotulo: t, teste: (r: Reg) => r.tipo === t })),
  ],
  ordenar: (a, b) => nivelDe(b as Risco).valor - nivelDe(a as Risco).valor || a.setor.localeCompare(b.setor),
  acoesExtras: (r) => (
    <button className="btn btn-sm" disabled={r.acaoGerada || !r.medidasPropostas} title={r.medidasPropostas ? 'Criar ação no plano de ação' : 'Preencha as medidas propostas'} onClick={() => gerarAcao(r as Risco)}>
      <ListPlus size={14} /> {r.acaoGerada ? 'Ação criada' : 'Gerar ação'}
    </button>
  ),
  botoesExtras: (
    <Link to="/app/pgr/imprimir" className="btn">
      <Printer size={16} /> Imprimir inventário
    </Link>
  ),
  cabecalhoExtra: <Matriz />,
}

function gerarAcao(r: Risco) {
  const n = nivelDe(r)
  db.adicionar('acoes', {
    empresaId: r.empresaId,
    oque: r.medidasPropostas,
    porque: `Risco ${n.nome.toLowerCase()} (${n.valor}): ${r.perigo}`,
    onde: r.setor,
    quem: r.responsavel,
    quando: r.prazo || addDias(hoje(), n.valor >= 15 ? 15 : n.valor >= 10 ? 30 : 60),
    como: '',
    quanto: '',
    prioridade: n.valor >= 10 ? 'Alta' : n.valor >= 5 ? 'Média' : 'Baixa',
    status: 'Aberta',
    origem: 'Inventário de riscos (PGR)',
  })
  db.atualizar('riscos', r.id, { acaoGerada: true })
  toast('Ação criada no plano de ação')
}

/** Matriz 5×5 com a quantidade de riscos em cada célula. */
function Matriz() {
  const d = useDB()
  const lista = daEmpresaAtiva(d, d.riscos)
  const conta = (p: number, s: number) => lista.filter((r) => (parseInt(r.probabilidade) || 1) === p && (parseInt(r.severidade) || 1) === s).length
  return (
    <div className="card card-pad" style={{ marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Matriz de risco</div>
        <div className="matriz">
          <div className="eixo-y">Probabilidade</div>
          <div className="grade">
            {[5, 4, 3, 2, 1].map((p) => (
              <div className="linha-m" key={p}>
                <span className="rot">{p}</span>
                {[1, 2, 3, 4, 5].map((s) => {
                  const n = conta(p, s)
                  return <span key={s} className={'cel risco ' + nivelRisco(p, s).cls} title={`P${p} × S${s} = ${p * s}`}>{n || ''}</span>
                })}
              </div>
            ))}
            <div className="linha-m"><span className="rot" />{[1, 2, 3, 4, 5].map((s) => <span key={s} className="rot">{s}</span>)}</div>
            <div className="eixo-x">Severidade</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
        {(['critico', 'alto', 'moderado', 'baixo'] as const).map((c) => {
          const nome = { critico: 'Crítico (15–25)', alto: 'Alto (10–14)', moderado: 'Moderado (5–9)', baixo: 'Baixo (1–4)' }[c]
          const n = lista.filter((r) => nivelDe(r).cls === c).length
          return <div key={c}><span className={'risco ' + c}>{n}</span> {nome}</div>
        })}
        <div className="nota" style={{ marginTop: 4 }}>{lista.length} risco(s) · {lista.reduce((s, r) => s + (Number(r.expostos) || 0), 0)} exposições</div>
      </div>
    </div>
  )
}

export default function Riscos() {
  return <CrudPage cfg={cfg} />
}

/** Versão para impressão do inventário (anexo do PGR). */
export function ImprimirInventario() {
  const d = useDB()
  const empresaId = d.config.empresaAtiva
  const empresa = d.empresas.find((e) => e.id === empresaId)
  const lista = [...daEmpresaAtiva(d, d.riscos)].sort((a, b) => a.setor.localeCompare(b.setor) || nivelDe(b).valor - nivelDe(a).valor)
  const setores = [...new Set(lista.map((r) => r.setor))]
  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/pgr"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Inventário de riscos</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo="Imprimir inventário de riscos" sub={empresa ? empresa.nome : 'Todas as empresas — escolha uma empresa no topo para imprimir só a dela'}>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>
      </div>
      <div className="doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>INVENTÁRIO DE RISCOS OCUPACIONAIS</h2>
        <div className="sub-doc">Programa de Gerenciamento de Riscos – NR-1</div>
        <div className="info">
          <div><b>Empresa:</b> {empresa?.nome ?? 'Todas as empresas'}</div>
          <div><b>CNPJ:</b> {empresa?.cnpj ?? '—'}</div>
          <div><b>CNAE / grau de risco:</b> {empresa ? `${empresa.cnae} / ${empresa.grauRisco}` : '—'}</div>
          <div><b>Data:</b> {fmtData(hoje())}</div>
        </div>
        {setores.length === 0 && <p className="vazio-doc">Nenhum risco cadastrado.</p>}
        {setores.map((s) => (
          <div key={s}>
            <h4 className="secao-doc">{s}</h4>
            <table>
              <thead>
                <tr><th>Tipo</th><th>Perigo / fonte</th><th>Funções</th><th>Lesões</th><th>Exp.</th><th>P×S</th><th>Medidas existentes</th><th>Medidas propostas</th></tr>
              </thead>
              <tbody>
                {lista.filter((r) => r.setor === s).map((r) => {
                  const n = nivelDe(r)
                  return (
                    <tr key={r.id}>
                      <td>{r.tipo}</td>
                      <td>{r.perigo}{r.fonte ? ` – ${r.fonte}` : ''}</td>
                      <td>{r.funcoes}</td>
                      <td>{r.lesoes}</td>
                      <td>{r.expostos}</td>
                      <td>{parseInt(r.probabilidade)}×{parseInt(r.severidade)}={n.valor}<br />{n.nome}</td>
                      <td>{r.medidasExistentes}</td>
                      <td>{r.medidasPropostas}{r.prazo ? ` (até ${fmtData(r.prazo)})` : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
        <p className="nota">Critério: probabilidade (1 rara a 5 quase certa) × severidade (1 insignificante a 5 catastrófica). Baixo 1–4 · moderado 5–9 · alto 10–14 · crítico 15–25.</p>
        <div className="assinaturas">
          <BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}{d.config.registro ? ` – ${d.config.registro}` : ''}<br />Responsável técnico</BlocoAssinatura>
          <div>{empresa?.responsavel || 'Responsável pela organização'}<br />Organização</div>
        </div>
      </div>
    </>
  )
}

