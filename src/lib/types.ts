export type ID = string

/** Assinatura feita na tela (imagem PNG em data URL). */
export interface Assinatura {
  nome: string
  imagem: string
  em: string // data e hora ISO
}

export interface Empresa {
  id: ID
  nome: string
  cnpj: string
  cnae: string
  logo?: string // data URL (imagem reduzida)
  grauRisco: string
  endereco: string
  responsavel: string
  telefone: string
}

export interface Colaborador {
  id: ID
  empresaId: ID
  nome: string
  matricula: string
  funcao: string
  setor: string
  admissao: string
  status: 'Ativo' | 'Afastado' | 'Desligado'
  telefone: string
}

export interface Epi {
  id: ID
  nome: string
  ca: string
  validadeCa: string
  fabricante: string
  estoque: number
  estoqueMinimo: number
  vidaUtilDias: number
}

export interface Entrega {
  id: ID
  colaboradorId: ID
  epiId: ID
  quantidade: number
  data: string
  proximaTroca: string
  motivo: string
  assinatura?: Assinatura
}

export interface Treinamento {
  id: ID
  colaboradorId: ID
  curso: string
  data: string
  validade: string
  cargaHoraria: number
  instrutor: string
}

export interface Aso {
  id: ID
  colaboradorId: ID
  tipo: string
  data: string
  validade: string
  resultado: string
  medico: string
}

export interface Ocorrencia {
  id: ID
  empresaId: ID
  colaboradorId: ID
  data: string
  tipo: string
  gravidade: string
  diasPerdidos: number
  local: string
  parteCorpo: string
  descricao: string
  cat: string
  status: string
  investigacao?: Investigacao
}

export interface Investigacao {
  dataInicio: string
  equipe: string
  testemunhas: string
  sequencia: string // como aconteceu
  porques: string[] // 5 porquês
  causas: Record<string, string> // categorias (6M): Método, Mão de obra, Máquina, Material, Meio ambiente, Medição
  causaRaiz: string
  conclusao: string
  acoesGeradas?: boolean
  concluida?: boolean
}

export interface ItemPt {
  texto: string
  resposta: 'S' | 'N' | 'NA' | ''
}

export interface Pt {
  id: ID
  empresaId: ID
  numero: string
  tipo: string
  atividade: string
  local: string
  data: string
  horaInicio: string
  horaFim: string
  executantes: string
  emitente: string
  aprNumero: string
  checklist: ItemPt[]
  medicoes: { o2: string; lel: string; h2s: string; co: string }
  observacoes: string
  status: 'Aberta' | 'Encerrada' | 'Cancelada'
  assinaturas?: Assinatura[]
}

export interface ModeloProprio {
  id: ID
  nome: string
  nr: string
  itens: string[]
}

export interface InspecaoExtintor {
  data: string
  ok: boolean
  itensNc: string[]
  obs: string
  responsavel: string
}

export interface Extintor {
  id: ID
  empresaId: ID
  numero: string
  tipo: string
  capacidade: string
  local: string
  ultimaRecarga: string
  proximaRecarga: string
  ultimoTeste: string
  proximoTeste: string
  ultimaInspecao: string
  status: string
  observacoes: string
  inspecoes?: InspecaoExtintor[]
}

export interface Risco {
  id: ID
  empresaId: ID
  setor: string
  funcoes: string
  atividade: string
  tipo: string
  perigo: string
  fonte: string
  lesoes: string
  expostos: number
  probabilidade: string
  severidade: string
  medidasExistentes: string
  medidasPropostas: string
  responsavel: string
  prazo: string
  acaoGerada?: boolean
}

export interface MembroCipa {
  nome: string
  funcao: string
  representacao: string
}

export interface Cipa {
  id: ID
  empresaId: ID
  gestao: string
  inicio: string
  fim: string
  membros: MembroCipa[]
}

export interface ReuniaoCipa {
  id: ID
  cipaId: ID
  data: string
  hora: string
  tipo: string
  local: string
  pauta: string
  deliberacoes: string
  presentes: string[]
  status: 'Agendada' | 'Realizada' | 'Cancelada'
  assinaturas?: Assinatura[]
}

export interface Requisito {
  id: ID
  funcao: string
  cursos: string[]
}

export interface Acao {
  id: ID
  empresaId: ID
  oque: string
  porque: string
  onde: string
  quem: string
  quando: string
  como: string
  quanto: string
  prioridade: string
  status: 'Aberta' | 'Em andamento' | 'Concluída'
  origem: string
}

export interface Dds {
  id: ID
  empresaId: ID
  data: string
  tema: string
  responsavel: string
  participantes: number
  duracao: number
  observacoes: string
  presencas?: Assinatura[]
}

export type Resposta = 'C' | 'NC' | 'NA' | ''

export interface ItemInspecao {
  texto: string
  resposta: Resposta
  obs: string
}

export interface Inspecao {
  id: ID
  empresaId: ID
  modelo: string
  titulo: string
  local: string
  data: string
  responsavel: string
  itens: ItemInspecao[]
  status: 'Em andamento' | 'Concluída'
  acoesGeradas?: boolean
}

export interface EtapaApr {
  etapa: string
  perigos: string
  riscos: string
  probabilidade: number
  severidade: number
  medidas: string
  epis: string
}

export interface Apr {
  id: ID
  empresaId: ID
  numero: string
  atividade: string
  local: string
  data: string
  responsavel: string
  equipe: string
  etapas: EtapaApr[]
  status: 'Rascunho' | 'Aprovada' | 'Encerrada'
  assinaturas?: Assinatura[]
}

export interface Config {
  tecnico: string
  corPrimaria?: string
  logo?: string // logo do técnico / consultoria (data URL)
  assinatura?: string // assinatura do técnico (data URL)
  registro: string
  email: string
  telefone: string
  alertaDias: number
  tema: 'auto' | 'claro' | 'escuro'
  empresaAtiva: ID
}

export interface DB {
  empresas: Empresa[]
  colaboradores: Colaborador[]
  epis: Epi[]
  entregas: Entrega[]
  treinamentos: Treinamento[]
  asos: Aso[]
  ocorrencias: Ocorrencia[]
  acoes: Acao[]
  dds: Dds[]
  inspecoes: Inspecao[]
  aprs: Apr[]
  pts: Pt[]
  requisitos: Requisito[]
  modelos: ModeloProprio[]
  extintores: Extintor[]
  riscos: Risco[]
  cipas: Cipa[]
  reunioes: ReuniaoCipa[]
  config: Config
}

export type ColKey = Exclude<keyof DB, 'config'>
