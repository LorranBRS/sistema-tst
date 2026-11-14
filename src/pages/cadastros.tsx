// Configuração dos módulos de cadastro que usam a página genérica (CrudPage).
import { ExternalLink, FileSearch, FileText, Lightbulb } from 'lucide-react'
import { BotaoImportarColaboradores } from '../components/ImportarColaboradores'
import { CrudPage, type CrudConfig, type Reg } from '../components/CrudPage'
import { BadgeStatus, Link, Validade, toast } from '../components/ui'
import { CAEPI_URL, CURSOS, GRAVIDADES, MOTIVOS_ENTREGA, TEMAS_DDS, TIPOS_ASO, TIPOS_OCORRENCIA } from '../lib/catalogos'
import { db, nomes } from '../lib/store'
import type { DB } from '../lib/types'
import { addDias, addMeses, diasAte, fmtData, situacao } from '../lib/utils'

const alerta = (d: DB) => d.config.alertaDias
const vencido = (campo: string) => (r: Reg, d: DB) => situacao(r[campo], alerta(d)) === 'vencido'
const aVencer = (campo: string) => (r: Reg, d: DB) => situacao(r[campo], alerta(d)) === 'avencer'
const porData = (campo: string, desc = true) => (a: Reg, b: Reg) =>
  desc ? String(b[campo]).localeCompare(String(a[campo])) : String(a[campo] || '9999').localeCompare(String(b[campo] || '9999'))

const colEmpresa = { rotulo: 'Empresa', texto: (r: Reg, d: DB) => nomes.empresa(d, r.empresaId), esconderMobile: true }
const campoEmpresa = { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref' as const, ref: 'empresas' as const, obrigatorio: true }
const colColab = (rotulo = 'Colaborador') => ({
  rotulo,
  texto: (r: Reg, d: DB) => nomes.colaborador(d, r.colaboradorId),
  render: (r: Reg, d: DB) => {
    const c = d.colaboradores.find((x) => x.id === r.colaboradorId)
    return (
      <div>
        <strong>{c?.nome ?? '—'}</strong>
        {c && <span className="sub">{c.funcao}</span>}
      </div>
    )
  },
})
const campoColab = { nome: 'colaboradorId', rotulo: 'Colaborador', tipo: 'ref' as const, ref: 'colaboradores' as const, obrigatorio: true, full: true }

/* ---------- Empresas ---------- */
export const cfgEmpresas: CrudConfig = {
  colecao: 'empresas',
  titulo: 'Empresas',
  sub: 'Clientes e unidades atendidas. Use o seletor no topo para trabalhar com uma empresa por vez.',
  singular: 'Empresa',
  feminino: true,
  campos: [
    { nome: 'nome', rotulo: 'Razão social / nome', tipo: 'text', obrigatorio: true, full: true },
    { nome: 'cnpj', rotulo: 'CNPJ', tipo: 'text', placeholder: '00.000.000/0000-00' },
    { nome: 'cnae', rotulo: 'CNAE principal', tipo: 'text', placeholder: '0000-0/00' },
    { nome: 'grauRisco', rotulo: 'Grau de risco (NR-4)', tipo: 'select', opcoes: ['1', '2', '3', '4'] },
    { nome: 'responsavel', rotulo: 'Responsável / contato', tipo: 'text' },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'text' },
    { nome: 'endereco', rotulo: 'Endereço', tipo: 'text', full: true },
    { nome: 'logo', rotulo: 'Logo da empresa', tipo: 'imagem', ajuda: 'Aparece no topo das fichas, APRs, PTs, inspeções e relatórios impressos' },
  ],
  colunas: [
    {
      rotulo: 'Empresa',
      texto: (r) => r.nome,
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {r.logo && <img src={r.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: '#fff', border: '1px solid var(--border)' }} />}
          <div><strong>{r.nome}</strong><span className="sub">{r.cnpj}</span></div>
        </div>
      ),
    },
    { rotulo: 'CNAE', texto: (r) => r.cnae, esconderMobile: true },
    { rotulo: 'Grau de risco', texto: (r) => r.grauRisco, render: (r) => (r.grauRisco ? <span className="badge">GR {r.grauRisco}</span> : '—') },
    { rotulo: 'Colaboradores', texto: (r, d) => String(d.colaboradores.filter((c) => c.empresaId === r.id && c.status !== 'Desligado').length) },
    { rotulo: 'Contato', texto: (r) => r.responsavel, render: (r) => <div>{r.responsavel || '—'}<span className="sub">{r.telefone}</span></div>, esconderMobile: true },
  ],
  acoesExtras: (r) => (
    <button className="btn btn-sm" onClick={() => db.configurar({ empresaAtiva: r.id })} title="Filtrar o sistema por esta empresa">
      Selecionar
    </button>
  ),
}

/* ---------- Colaboradores ---------- */
export const cfgColaboradores: CrudConfig = {
  colecao: 'colaboradores',
  titulo: 'Colaboradores',
  sub: 'Trabalhadores das empresas atendidas, com acesso rápido à ficha de EPI.',
  singular: 'Colaborador',
  escopo: 'empresa',
  campos: [
    { nome: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true, full: true },
    campoEmpresa,
    { nome: 'matricula', rotulo: 'Matrícula', tipo: 'text' },
    { nome: 'funcao', rotulo: 'Função / cargo', tipo: 'text', obrigatorio: true },
    { nome: 'setor', rotulo: 'Setor', tipo: 'text' },
    { nome: 'admissao', rotulo: 'Data de admissão', tipo: 'date' },
    { nome: 'status', rotulo: 'Situação', tipo: 'select', opcoes: ['Ativo', 'Afastado', 'Desligado'], obrigatorio: true },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'text' },
  ],
  padroes: () => ({ status: 'Ativo' }),
  colunas: [
    { rotulo: 'Nome', texto: (r) => r.nome, render: (r) => <div><strong>{r.nome}</strong><span className="sub">Mat. {r.matricula || '—'}</span></div> },
    { rotulo: 'Função', texto: (r) => r.funcao, render: (r) => <div>{r.funcao}<span className="sub">{r.setor}</span></div> },
    colEmpresa,
    { rotulo: 'Admissão', texto: (r) => fmtData(r.admissao), esconderMobile: true },
    { rotulo: 'Situação', texto: (r) => r.status, render: (r) => <BadgeStatus valor={r.status} /> },
    {
      rotulo: 'Pendências',
      texto: (r, d) => String(pendencias(r.id, d)),
      render: (r, d) => {
        const n = pendencias(r.id, d)
        return n ? <span className="badge vencido">{n} vencido(s)</span> : <span className="badge ok">OK</span>
      },
      esconderMobile: true,
    },
  ],
  filtros: [
    { rotulo: 'Ativos', teste: (r) => r.status === 'Ativo' },
    { rotulo: 'Afastados', teste: (r) => r.status === 'Afastado' },
    { rotulo: 'Com pendências', teste: (r, d) => pendencias(r.id, d) > 0 },
  ],
  ordenar: (a, b) => a.nome.localeCompare(b.nome),
  botoesExtras: <BotaoImportarColaboradores />,
  acoesExtras: (r) => (
    <Link to={'/app/ficha-epi/' + r.id} className="btn btn-sm" >
      <FileText size={14} /> Ficha EPI
    </Link>
  ),
}
/** Treinamentos e ASOs vencidos do colaborador (considera só o registro mais recente de cada curso/ASO). */
function pendencias(colabId: string, d: DB) {
  const ultimos = new Map<string, string>()
  for (const t of d.treinamentos.filter((t) => t.colaboradorId === colabId)) {
    const atual = ultimos.get(t.curso)
    if (!atual || t.validade > atual) ultimos.set(t.curso, t.validade)
  }
  let n = [...ultimos.values()].filter((v) => v && diasAte(v) < 0).length
  const aso = d.asos.filter((a) => a.colaboradorId === colabId && a.validade).sort((a, b) => b.data.localeCompare(a.data))[0]
  if (aso && diasAte(aso.validade) < 0) n++
  return n
}

/* ---------- EPIs (catálogo) ---------- */
export const cfgEpis: CrudConfig = {
  colecao: 'epis',
  titulo: 'EPIs e estoque',
  sub: 'Catálogo de EPIs com número e validade do CA, estoque mínimo e vida útil para a troca.',
  singular: 'EPI',
  campos: [
    { nome: 'nome', rotulo: 'Descrição do EPI', tipo: 'text', obrigatorio: true, full: true },
    { nome: 'ca', rotulo: 'Nº do CA', tipo: 'text', obrigatorio: true },
    { nome: 'validadeCa', rotulo: 'Validade do CA', tipo: 'date', ajuda: 'Confira no botão "Consultar CA" da lista (consulta oficial do Ministério do Trabalho)' },
    { nome: 'fabricante', rotulo: 'Fabricante', tipo: 'text' },
    { nome: 'vidaUtilDias', rotulo: 'Vida útil / troca (dias)', tipo: 'number', ajuda: 'Usado para sugerir a próxima troca' },
    { nome: 'estoque', rotulo: 'Estoque atual', tipo: 'number' },
    { nome: 'estoqueMinimo', rotulo: 'Estoque mínimo', tipo: 'number' },
  ],
  padroes: () => ({ vidaUtilDias: 180, estoque: 0, estoqueMinimo: 5 }),
  colunas: [
    { rotulo: 'EPI', texto: (r) => r.nome, render: (r) => <div><strong>{r.nome}</strong><span className="sub">{r.fabricante}</span></div> },
    { rotulo: 'CA', texto: (r) => r.ca },
    { rotulo: 'Validade do CA', texto: (r) => fmtData(r.validadeCa), render: (r, d) => <Validade iso={r.validadeCa} alerta={alerta(d)} /> },
    {
      rotulo: 'Estoque',
      texto: (r) => String(r.estoque),
      render: (r) => (
        <div>
          <strong>{r.estoque}</strong> <span className="sub">mín. {r.estoqueMinimo}</span>
          {r.estoque <= r.estoqueMinimo && <span className="badge avencer">Repor</span>}
        </div>
      ),
    },
    { rotulo: 'Troca', texto: (r) => `${r.vidaUtilDias} dias`, esconderMobile: true },
  ],
  filtros: [
    { rotulo: 'CA vencido', teste: vencido('validadeCa') },
    { rotulo: 'CA a vencer', teste: aVencer('validadeCa') },
    { rotulo: 'Estoque baixo', teste: (r) => r.estoque <= r.estoqueMinimo },
  ],
  ordenar: (a, b) => a.nome.localeCompare(b.nome),
  acoesExtras: (r) => (
    <button className="btn btn-sm" title="Copia o nº do CA e abre a consulta oficial do Ministério do Trabalho" onClick={() => consultarCA(r.ca)}>
      <ExternalLink size={14} /> Consultar CA
    </button>
  ),
}

/** Copia o nº do CA e abre a consulta oficial (o site do governo não oferece consulta automática). */
function consultarCA(ca: string) {
  const abrir = () => window.open(CAEPI_URL, '_blank', 'noopener')
  if (navigator.clipboard && ca) {
    navigator.clipboard.writeText(String(ca)).then(
      () => toast(`CA ${ca} copiado — cole no campo "Nº do CA" da consulta`),
      () => toast(`Digite o CA ${ca} na consulta oficial`),
    )
  } else if (ca) toast(`Digite o CA ${ca} na consulta oficial`)
  abrir()
}

/* ---------- Entregas de EPI ---------- */
export const cfgEntregas: CrudConfig = {
  colecao: 'entregas',
  titulo: 'Entregas de EPI',
  sub: 'Registro de fornecimento (NR-6). A entrega baixa o estoque e calcula a próxima troca.',
  singular: 'Entrega',
  feminino: true,
  escopo: 'colaborador',
  campos: [
    campoColab,
    { nome: 'epiId', rotulo: 'EPI', tipo: 'ref', ref: 'epis', obrigatorio: true, full: true },
    { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'number', obrigatorio: true },
    { nome: 'motivo', rotulo: 'Motivo', tipo: 'select', opcoes: MOTIVOS_ENTREGA, obrigatorio: true },
    { nome: 'data', rotulo: 'Data da entrega', tipo: 'date', obrigatorio: true },
    { nome: 'proximaTroca', rotulo: 'Próxima troca prevista', tipo: 'date', ajuda: 'Calculada pela vida útil do EPI' },
  ],
  padroes: () => ({ quantidade: 1, motivo: 'Primeira entrega' }),
  derivar: (v, campo, d) => {
    if (campo !== 'epiId' && campo !== 'data') return {}
    const epi = d.epis.find((e) => e.id === v.epiId)
    return epi && v.data && epi.vidaUtilDias ? { proximaTroca: addDias(v.data, epi.vidaUtilDias) } : {}
  },
  aoCriar: (r) => {
    const epi = db.buscar('epis', r.epiId)
    if (epi) db.atualizar('epis', epi.id, { estoque: Math.max(0, epi.estoque - (Number(r.quantidade) || 0)) })
  },
  colunas: [
    colColab(),
    { rotulo: 'EPI', texto: (r, d) => nomes.epi(d, r.epiId), render: (r, d) => { const e = d.epis.find((x) => x.id === r.epiId); return <div>{e?.nome ?? '—'}<span className="sub">CA {e?.ca} · Qtd {r.quantidade}</span></div> } },
    { rotulo: 'Entrega', texto: (r) => fmtData(r.data) },
    { rotulo: 'Motivo', texto: (r) => r.motivo, esconderMobile: true },
    { rotulo: 'Próxima troca', texto: (r) => fmtData(r.proximaTroca), render: (r, d) => <Validade iso={r.proximaTroca} alerta={7} /> },
  ],
  filtros: [
    { rotulo: 'Troca atrasada', teste: (r) => situacao(r.proximaTroca, 7) === 'vencido' },
    { rotulo: 'Troca em 7 dias', teste: (r) => situacao(r.proximaTroca, 7) === 'avencer' },
  ],
  ordenar: porData('data'),
}

/* ---------- Treinamentos ---------- */
export const cfgTreinamentos: CrudConfig = {
  colecao: 'treinamentos',
  titulo: 'Treinamentos',
  sub: 'Capacitações por NR com cálculo automático da reciclagem. Prazos sugeridos — confira a NR e o PGR.',
  singular: 'Treinamento',
  escopo: 'colaborador',
  campos: [
    campoColab,
    { nome: 'curso', rotulo: 'Curso / NR', tipo: 'datalist', opcoes: CURSOS.map((c) => c.nome), obrigatorio: true, full: true, placeholder: 'Escolha da lista ou digite' },
    { nome: 'data', rotulo: 'Data de realização', tipo: 'date', obrigatorio: true },
    { nome: 'validade', rotulo: 'Validade / reciclagem', tipo: 'date', ajuda: 'Preenchida pelo prazo sugerido do curso' },
    { nome: 'cargaHoraria', rotulo: 'Carga horária (h)', tipo: 'number' },
    { nome: 'instrutor', rotulo: 'Instrutor / entidade', tipo: 'text' },
  ],
  derivar: (v, campo) => {
    if (campo !== 'curso' && campo !== 'data') return {}
    const c = CURSOS.find((x) => x.nome === v.curso)
    if (!c) return {}
    return {
      validade: c.meses && v.data ? addMeses(v.data, c.meses) : '',
      ...(campo === 'curso' ? { cargaHoraria: c.cargaHoraria } : {}),
    }
  },
  colunas: [
    colColab(),
    { rotulo: 'Curso', texto: (r) => r.curso, render: (r) => <div>{r.curso}<span className="sub">{r.cargaHoraria}h · {r.instrutor || '—'}</span></div> },
    { rotulo: 'Realização', texto: (r) => fmtData(r.data), esconderMobile: true },
    { rotulo: 'Validade', texto: (r) => fmtData(r.validade), render: (r, d) => <Validade iso={r.validade} alerta={alerta(d)} /> },
  ],
  filtros: [
    { rotulo: 'Vencidos', teste: vencido('validade') },
    { rotulo: 'A vencer', teste: aVencer('validade') },
  ],
  ordenar: porData('validade', false),
}

/* ---------- ASOs ---------- */
export const cfgAsos: CrudConfig = {
  colecao: 'asos',
  titulo: 'ASOs e exames',
  sub: 'Atestados de Saúde Ocupacional (NR-7) com controle do próximo periódico.',
  singular: 'ASO',
  escopo: 'colaborador',
  campos: [
    campoColab,
    { nome: 'tipo', rotulo: 'Tipo de exame', tipo: 'select', opcoes: TIPOS_ASO.map((t) => t.nome), obrigatorio: true },
    { nome: 'resultado', rotulo: 'Resultado', tipo: 'select', opcoes: ['Apto', 'Apto com restrição', 'Inapto'], obrigatorio: true },
    { nome: 'data', rotulo: 'Data do exame', tipo: 'date', obrigatorio: true },
    { nome: 'validade', rotulo: 'Próximo exame / validade', tipo: 'date', ajuda: 'Periodicidade conforme o PCMSO' },
    { nome: 'medico', rotulo: 'Médico examinador (CRM)', tipo: 'text', full: true },
  ],
  padroes: () => ({ tipo: 'Periódico', resultado: 'Apto' }),
  derivar: (v, campo) => {
    if (campo !== 'tipo' && campo !== 'data') return {}
    const t = TIPOS_ASO.find((x) => x.nome === v.tipo)
    return t && v.data ? { validade: t.meses ? addMeses(v.data, t.meses) : '' } : {}
  },
  colunas: [
    colColab(),
    { rotulo: 'Tipo', texto: (r) => r.tipo },
    { rotulo: 'Resultado', texto: (r) => r.resultado, render: (r) => <BadgeStatus valor={r.resultado} /> },
    { rotulo: 'Exame', texto: (r) => fmtData(r.data), esconderMobile: true },
    { rotulo: 'Próximo exame', texto: (r) => fmtData(r.validade), render: (r, d) => <Validade iso={r.validade} alerta={alerta(d)} /> },
  ],
  filtros: [
    { rotulo: 'Vencidos', teste: vencido('validade') },
    { rotulo: 'A vencer', teste: aVencer('validade') },
  ],
  ordenar: porData('validade', false),
}

/* ---------- Ocorrências ---------- */
export const cfgOcorrencias: CrudConfig = {
  colecao: 'ocorrencias',
  titulo: 'Acidentes e ocorrências',
  sub: 'Acidentes, incidentes e quase acidentes, com controle de CAT e investigação.',
  singular: 'Ocorrência',
  feminino: true,
  escopo: 'empresa',
  campos: [
    campoEmpresa,
    { nome: 'colaboradorId', rotulo: 'Colaborador envolvido', tipo: 'ref', ref: 'colaboradores' },
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_OCORRENCIA, obrigatorio: true },
    { nome: 'gravidade', rotulo: 'Gravidade', tipo: 'select', opcoes: GRAVIDADES, obrigatorio: true },
    { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true },
    { nome: 'diasPerdidos', rotulo: 'Dias perdidos', tipo: 'number', ajuda: 'Usado na taxa de gravidade' },
    { nome: 'local', rotulo: 'Local', tipo: 'text' },
    { nome: 'parteCorpo', rotulo: 'Parte do corpo atingida', tipo: 'text' },
    { nome: 'cat', rotulo: 'Nº da CAT', tipo: 'text', ajuda: 'Emitir até o 1º dia útil seguinte (imediato em caso de óbito)' },
    { nome: 'status', rotulo: 'Investigação', tipo: 'select', opcoes: ['Em investigação', 'Concluída'], obrigatorio: true },
    { nome: 'descricao', rotulo: 'Descrição do ocorrido', tipo: 'textarea' },
  ],
  padroes: () => ({ status: 'Em investigação', tipo: 'Acidente típico', gravidade: 'Sem afastamento' }),
  colunas: [
    { rotulo: 'Data', texto: (r) => fmtData(r.data) },
    { rotulo: 'Ocorrência', texto: (r) => `${r.tipo} ${r.descricao}`, render: (r) => <div><strong>{r.tipo}</strong><span className="sub">{r.local}</span></div> },
    { rotulo: 'Envolvido', texto: (r, d) => (r.colaboradorId ? nomes.colaborador(d, r.colaboradorId) : '—'), esconderMobile: true },
    { rotulo: 'Gravidade', texto: (r) => r.gravidade, render: (r) => <div><BadgeStatus valor={r.gravidade} />{r.diasPerdidos > 0 && <span className="sub">{r.diasPerdidos} dias perdidos</span>}</div> },
    {
      rotulo: 'CAT',
      texto: (r) => r.cat,
      render: (r) => (r.cat ? r.cat : ['Acidente típico', 'Acidente de trajeto', 'Doença ocupacional'].includes(r.tipo) ? <span className="badge vencido">Pendente</span> : <span className="sub">N/A</span>),
      esconderMobile: true,
    },
    { rotulo: 'Status', texto: (r) => r.status, render: (r) => <BadgeStatus valor={r.status} /> },
  ],
  filtros: [
    { rotulo: 'Acidentes', teste: (r) => ['Acidente típico', 'Acidente de trajeto', 'Doença ocupacional'].includes(r.tipo) },
    { rotulo: 'Quase acidentes', teste: (r) => r.tipo === 'Quase acidente' },
    { rotulo: 'Em investigação', teste: (r) => r.status === 'Em investigação' },
  ],
  ordenar: porData('data'),
  acoesExtras: (r) => (
    <Link to={'/app/investigacao/' + r.id} className="btn btn-sm">
      <FileSearch size={14} /> {r.investigacao?.concluida ? 'Investigação' : r.investigacao ? 'Continuar' : 'Investigar'}
    </Link>
  ),
}

/* ---------- Plano de ação (5W2H) ---------- */
export const cfgAcoes: CrudConfig = {
  colecao: 'acoes',
  titulo: 'Plano de ação',
  sub: 'Ações corretivas e preventivas no formato 5W2H, vindas de inspeções, acidentes e auditorias.',
  singular: 'Ação',
  feminino: true,
  escopo: 'empresa',
  campos: [
    { nome: 'oque', rotulo: 'O quê (ação)', tipo: 'text', obrigatorio: true, full: true },
    { nome: 'porque', rotulo: 'Por quê', tipo: 'text', full: true },
    campoEmpresa,
    { nome: 'onde', rotulo: 'Onde', tipo: 'text' },
    { nome: 'quem', rotulo: 'Quem (responsável)', tipo: 'text', obrigatorio: true },
    { nome: 'quando', rotulo: 'Quando (prazo)', tipo: 'date', obrigatorio: true },
    { nome: 'como', rotulo: 'Como', tipo: 'text' },
    { nome: 'quanto', rotulo: 'Quanto custa', tipo: 'text', placeholder: 'R$' },
    { nome: 'prioridade', rotulo: 'Prioridade', tipo: 'select', opcoes: ['Alta', 'Média', 'Baixa'], obrigatorio: true },
    { nome: 'status', rotulo: 'Status', tipo: 'select', opcoes: ['Aberta', 'Em andamento', 'Concluída'], obrigatorio: true },
    { nome: 'origem', rotulo: 'Origem', tipo: 'datalist', opcoes: ['Inspeção', 'Acidente típico', 'Quase acidente', 'Incidente', 'Auditoria', 'Fiscalização', 'CIPA', 'Vencimento de treinamento'] },
  ],
  padroes: () => ({ status: 'Aberta', prioridade: 'Média' }),
  colunas: [
    { rotulo: 'Ação', texto: (r) => r.oque, render: (r) => <div><strong>{r.oque}</strong><span className="sub">{r.origem ? 'Origem: ' + r.origem : r.porque}</span></div> },
    { rotulo: 'Responsável', texto: (r) => r.quem, esconderMobile: true },
    {
      rotulo: 'Prazo',
      texto: (r) => fmtData(r.quando),
      render: (r) => (
        <div>
          {fmtData(r.quando)}
          {r.status !== 'Concluída' && diasAte(r.quando) < 0 && <span className="sub" style={{ color: 'var(--danger)' }}>Atrasada {-diasAte(r.quando)} dia(s)</span>}
        </div>
      ),
    },
    { rotulo: 'Prioridade', texto: (r) => r.prioridade, render: (r) => <BadgeStatus valor={r.prioridade} />, esconderMobile: true },
    {
      rotulo: 'Status',
      texto: (r) => r.status,
      render: (r) => (
        <select
          className="input"
          style={{ padding: '4px 8px', fontSize: 13, width: 'auto' }}
          value={r.status}
          onChange={(e) => db.atualizar('acoes', r.id, { status: e.target.value as 'Aberta' })}
          aria-label="Alterar status"
        >
          <option>Aberta</option>
          <option>Em andamento</option>
          <option>Concluída</option>
        </select>
      ),
    },
  ],
  filtros: [
    { rotulo: 'Pendentes', teste: (r) => r.status !== 'Concluída' },
    { rotulo: 'Atrasadas', teste: (r) => r.status !== 'Concluída' && diasAte(r.quando) < 0 },
    { rotulo: 'Concluídas', teste: (r) => r.status === 'Concluída' },
  ],
  ordenar: (a, b) => (a.status === 'Concluída' ? 1 : 0) - (b.status === 'Concluída' ? 1 : 0) || a.quando.localeCompare(b.quando),
}

/* ---------- DDS ---------- */
export const cfgDds: CrudConfig = {
  colecao: 'dds',
  titulo: 'DDS – Diálogo Diário de Segurança',
  sub: 'Registro dos diálogos realizados e banco de temas prontos para usar.',
  singular: 'DDS',
  escopo: 'empresa',
  campos: [
    { nome: 'tema', rotulo: 'Tema', tipo: 'datalist', opcoes: TEMAS_DDS.map((t) => t.tema), obrigatorio: true, full: true },
    campoEmpresa,
    { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true },
    { nome: 'responsavel', rotulo: 'Quem conduziu', tipo: 'text', obrigatorio: true },
    { nome: 'participantes', rotulo: 'Participantes', tipo: 'number' },
    { nome: 'duracao', rotulo: 'Duração (min)', tipo: 'number' },
    { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' },
  ],
  padroes: (d) => ({ duracao: 10, responsavel: d.config.tecnico }),
  colunas: [
    { rotulo: 'Data', texto: (r) => fmtData(r.data) },
    { rotulo: 'Tema', texto: (r) => r.tema, render: (r) => <strong>{r.tema}</strong> },
    colEmpresa,
    { rotulo: 'Conduzido por', texto: (r) => r.responsavel, esconderMobile: true },
    { rotulo: 'Participantes', texto: (r) => String(r.participantes) },
    { rotulo: 'Duração', texto: (r) => `${r.duracao} min`, esconderMobile: true },
  ],
  ordenar: porData('data'),
}

export function PaginaDds() {
  return <CrudPage cfg={cfgDdsComTemas} />
}

function TemasDds() {
  const dia = Math.floor(Date.now() / 86400000) % TEMAS_DDS.length
  const t = TEMAS_DDS[dia]
  return (
    <div className="card card-pad" style={{ marginBottom: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span className="stat"><span className="ico" style={{ width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--warn-soft)', color: 'var(--warn)' }}><Lightbulb size={18} /></span></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Sugestão de tema para hoje</div>
        <div style={{ fontWeight: 700, fontSize: 16, margin: '2px 0 4px' }}>{t.tema}</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t.texto}</div>
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Ver todos os {TEMAS_DDS.length} temas</summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, display: 'grid', gap: 6 }}>
            {TEMAS_DDS.map((x) => (
              <li key={x.tema}>
                <strong>{x.tema}:</strong> <span style={{ color: 'var(--muted)' }}>{x.texto}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}

const cfgDdsComTemas: CrudConfig = { ...cfgDds, cabecalhoExtra: <TemasDds /> }

export const Pagina = (cfg: CrudConfig) => () => <CrudPage cfg={cfg} />
