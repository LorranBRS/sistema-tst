export type ID = string

export interface Empresa {
  id: ID
  nome: string
  cnpj: string
  cnae: string
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
}

export interface Config {
  tecnico: string
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
  config: Config
}

export type ColKey = Exclude<keyof DB, 'config'>
