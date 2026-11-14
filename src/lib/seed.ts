// Dados de demonstração (fictícios). As datas são relativas a hoje,
// para o painel sempre mostrar vencimentos e alertas realistas.
import type { DB, Config, Ocorrencia } from './types'
import { addDias, addMeses, hoje } from './utils'
import { ESCALA_PROB, ESCALA_SEV, MODELOS_INSPECAO, TIPOS_PT } from './catalogos'

export const configPadrao = (): Config => ({
  tecnico: 'Técnico(a) de Segurança',
  registro: '',
  email: '',
  telefone: '',
  alertaDias: 30,
  tema: 'auto',
  empresaAtiva: '',
})

export const dbVazio = (): DB => ({
  empresas: [],
  colaboradores: [],
  epis: [],
  entregas: [],
  treinamentos: [],
  asos: [],
  ocorrencias: [],
  acoes: [],
  dds: [],
  inspecoes: [],
  aprs: [],
  pts: [],
  requisitos: [],
  modelos: [],
  extintores: [],
  riscos: [],
  cipas: [],
  reunioes: [],
  config: configPadrao(),
})

export function dbDemo(): DB {
  const h = hoje()
  const d = (n: number) => addDias(h, n)

  const empresas = [
    { id: 'e1', nome: 'Construtora Horizonte (demo)', cnpj: '12.345.678/0001-90', cnae: '4120-4/00', grauRisco: '3', endereco: 'Av. das Obras, 1000 – Centro', responsavel: 'Marina Costa', telefone: '(11) 4000-1000' },
    { id: 'e2', nome: 'Metalúrgica Vale Forte (demo)', cnpj: '98.765.432/0001-10', cnae: '2512-8/00', grauRisco: '3', endereco: 'Rua da Indústria, 250 – Distrito Industrial', responsavel: 'Paulo Henrique', telefone: '(11) 4000-2000' },
  ]

  const c = (id: string, empresaId: string, nome: string, funcao: string, setor: string, admissao: number, status: 'Ativo' | 'Afastado' | 'Desligado' = 'Ativo') => ({
    id, empresaId, nome, matricula: id.toUpperCase().replace('C', '00'), funcao, setor, admissao: d(admissao), status, telefone: '',
  })
  const colaboradores = [
    c('c1', 'e1', 'Ana Beatriz Souza', 'Engenheira civil', 'Obras', -900),
    c('c2', 'e1', 'Carlos Eduardo Lima', 'Eletricista', 'Elétrica', -700),
    c('c3', 'e1', 'João Pedro Alves', 'Pedreiro', 'Obras', -400),
    c('c4', 'e1', 'Rafael Martins', 'Armador', 'Obras', -250),
    c('c5', 'e1', 'Luciana Ferreira', 'Montadora de andaimes', 'Obras', -180, 'Afastado'),
    c('c6', 'e2', 'Marcos Vinícius Rocha', 'Soldador', 'Caldeiraria', -1200),
    c('c7', 'e2', 'Fernanda Oliveira', 'Operadora de prensa', 'Estamparia', -600),
    c('c8', 'e2', 'Diego Santos', 'Operador de empilhadeira', 'Logística', -500),
    c('c9', 'e2', 'Patrícia Gomes', 'Mecânica de manutenção', 'Manutenção', -320),
    c('c10', 'e2', 'Thiago Ribeiro', 'Auxiliar de produção', 'Estamparia', -60),
  ]

  const epis = [
    { id: 'p1', nome: 'Capacete classe B com jugular', ca: '31469', validadeCa: d(400), fabricante: 'Fabricante A', estoque: 24, estoqueMinimo: 10, vidaUtilDias: 730 },
    { id: 'p2', nome: 'Óculos de proteção incolor', ca: '10346', validadeCa: d(18), fabricante: 'Fabricante B', estoque: 40, estoqueMinimo: 20, vidaUtilDias: 180 },
    { id: 'p3', nome: 'Protetor auditivo tipo plug', ca: '5745', validadeCa: d(220), fabricante: 'Fabricante C', estoque: 6, estoqueMinimo: 30, vidaUtilDias: 90 },
    { id: 'p4', nome: 'Luva de vaqueta', ca: '28010', validadeCa: d(-12), fabricante: 'Fabricante D', estoque: 35, estoqueMinimo: 20, vidaUtilDias: 60 },
    { id: 'p5', nome: 'Botina de segurança com biqueira', ca: '40377', validadeCa: d(600), fabricante: 'Fabricante E', estoque: 12, estoqueMinimo: 8, vidaUtilDias: 365 },
    { id: 'p6', nome: 'Cinturão tipo paraquedista', ca: '35529', validadeCa: d(300), fabricante: 'Fabricante F', estoque: 4, estoqueMinimo: 4, vidaUtilDias: 1095 },
    { id: 'p7', nome: 'Máscara de solda escurecimento automático', ca: '27822', validadeCa: d(150), fabricante: 'Fabricante G', estoque: 3, estoqueMinimo: 2, vidaUtilDias: 730 },
    { id: 'p8', nome: 'Respirador PFF2', ca: '38956', validadeCa: d(90), fabricante: 'Fabricante H', estoque: 50, estoqueMinimo: 40, vidaUtilDias: 7 },
  ]

  const ent = (id: string, colaboradorId: string, epiId: string, data: number, vida: number, motivo = 'Primeira entrega', quantidade = 1) => ({
    id, colaboradorId, epiId, quantidade, data: d(data), proximaTroca: d(data + vida), motivo,
  })
  const entregas = [
    ent('en1', 'c3', 'p1', -300, 730), ent('en2', 'c3', 'p5', -340, 365, 'Primeira entrega'),
    ent('en3', 'c3', 'p4', -70, 60, 'Troca por desgaste', 2), ent('en4', 'c2', 'p1', -200, 730),
    ent('en5', 'c2', 'p2', -170, 180), ent('en6', 'c6', 'p7', -400, 730), ent('en7', 'c6', 'p3', -80, 90, 'Troca por vencimento', 4),
    ent('en8', 'c7', 'p3', -95, 90), ent('en9', 'c8', 'p5', -20, 365), ent('en10', 'c4', 'p6', -100, 1095),
  ]

  const tr = (id: string, colaboradorId: string, curso: string, data: number, meses: number, ch: number) => ({
    id, colaboradorId, curso, data: d(data), validade: meses ? addMeses(d(data), meses) : '', cargaHoraria: ch, instrutor: 'SESMT',
  })
  const treinamentos = [
    tr('t1', 'c2', 'NR-10 Básico', -720, 24, 40),
    tr('t2', 'c4', 'NR-35 Trabalho em altura', -700, 24, 8),
    tr('t3', 'c5', 'NR-35 Trabalho em altura', -400, 24, 8),
    tr('t4', 'c3', 'NR-18 Admissional (construção)', -390, 24, 4),
    tr('t5', 'c8', 'NR-11 Operador de empilhadeira', -350, 12, 16),
    tr('t6', 'c6', 'NR-23 Brigada de incêndio', -380, 12, 16),
    tr('t7', 'c9', 'NR-10 Básico', -100, 24, 40),
    tr('t8', 'c7', 'NR-12 Máquinas e equipamentos', -200, 24, 8),
    tr('t9', 'c1', 'NR-35 Trabalho em altura', -30, 24, 8),
    tr('t10', 'c9', 'NR-33 Espaço confinado (autorizado/vigia)', -340, 12, 16),
  ]

  const aso = (id: string, colaboradorId: string, tipo: string, data: number, meses = 12, resultado = 'Apto') => ({
    id, colaboradorId, tipo, data: d(data), validade: meses ? addMeses(d(data), meses) : '', resultado, medico: 'Dra. Helena Prado (demo)',
  })
  const asos = [
    aso('a1', 'c1', 'Periódico', -200), aso('a2', 'c2', 'Periódico', -370), aso('a3', 'c3', 'Admissional', -350),
    aso('a4', 'c4', 'Admissional', -250), aso('a5', 'c6', 'Periódico', -100), aso('a6', 'c7', 'Periódico', -340),
    aso('a7', 'c8', 'Periódico', -30), aso('a8', 'c9', 'Admissional', -320), aso('a9', 'c10', 'Admissional', -60),
  ]

  const ocorrencias: Ocorrencia[] = [
    { id: 'o1', empresaId: 'e2', colaboradorId: 'c7', data: d(-240), tipo: 'Acidente típico', gravidade: 'Com afastamento', diasPerdidos: 12, local: 'Estamparia – prensa 3', parteCorpo: 'Mão esquerda', descricao: 'Corte na mão ao retirar peça da matriz.', cat: '2026.000123-4', status: 'Concluída' },
    { id: 'o2', empresaId: 'e1', colaboradorId: 'c3', data: d(-150), tipo: 'Quase acidente', gravidade: 'Sem lesão', diasPerdidos: 0, local: 'Bloco B – 3º pavimento', parteCorpo: '', descricao: 'Queda de tábua do andaime em área não isolada.', cat: '', status: 'Concluída' },
    { id: 'o3', empresaId: 'e1', colaboradorId: 'c4', data: d(-95), tipo: 'Acidente típico', gravidade: 'Sem afastamento', diasPerdidos: 0, local: 'Central de armação', parteCorpo: 'Antebraço direito', descricao: 'Escoriação ao manusear vergalhão sem luva.', cat: '2026.000456-7', status: 'Concluída' },
    { id: 'o4', empresaId: 'e2', colaboradorId: 'c8', data: d(-40), tipo: 'Incidente (dano material)', gravidade: 'Sem lesão', diasPerdidos: 0, local: 'Doca 2', parteCorpo: '', descricao: 'Empilhadeira colidiu com rack de armazenagem.', cat: '', status: 'Em investigação' },
    { id: 'o5', empresaId: 'e2', colaboradorId: 'c6', data: d(-18), tipo: 'Acidente típico', gravidade: 'Sem afastamento', diasPerdidos: 0, local: 'Caldeiraria', parteCorpo: 'Olhos', descricao: 'Projeção de fagulha nos olhos durante esmerilhamento.', cat: '2026.000789-0', status: 'Em investigação' },
  ]

  const acao = (id: string, empresaId: string, oque: string, quem: string, quando: number, status: 'Aberta' | 'Em andamento' | 'Concluída', origem: string, prioridade = 'Média') => ({
    id, empresaId, oque, porque: 'Eliminar condição de risco identificada', onde: '', quem, quando: d(quando), como: '', quanto: '', prioridade, status, origem,
  })
  const acoes = [
    acao('ac1', 'e1', 'Instalar guarda-corpo no 3º pavimento do bloco B', 'Encarregado de obra', -5, 'Em andamento', 'Quase acidente', 'Alta'),
    acao('ac2', 'e2', 'Instalar proteção de mãos (cortina de luz) na prensa 3', 'Manutenção', 20, 'Em andamento', 'Acidente típico', 'Alta'),
    acao('ac3', 'e2', 'Demarcar corredores de empilhadeira na doca 2', 'Logística', 10, 'Aberta', 'Incidente'),
    acao('ac4', 'e1', 'Reciclagem NR-35 da equipe de andaimes', 'SESMT', 30, 'Aberta', 'Vencimento de treinamento'),
    acao('ac5', 'e2', 'Trocar óculos por modelo ampla visão na caldeiraria', 'Almoxarifado', -2, 'Aberta', 'Acidente típico', 'Alta'),
    acao('ac6', 'e1', 'Recarregar extintores do almoxarifado', 'Brigada', -30, 'Concluída', 'Inspeção'),
  ]

  const dds = [
    { id: 'dd1', empresaId: 'e1', data: d(-1), tema: 'Trabalho em altura', responsavel: 'Técnico de segurança', participantes: 18, duracao: 10, observacoes: '' },
    { id: 'dd2', empresaId: 'e2', data: d(-2), tema: 'Máquinas e proteções', responsavel: 'Supervisor de produção', participantes: 22, duracao: 10, observacoes: '' },
    { id: 'dd3', empresaId: 'e1', data: d(-3), tema: 'Ordem e limpeza', responsavel: 'Encarregado de obra', participantes: 15, duracao: 8, observacoes: '' },
    { id: 'dd4', empresaId: 'e2', data: d(-6), tema: 'Proteção auditiva', responsavel: 'Técnico de segurança', participantes: 20, duracao: 12, observacoes: '' },
  ]

  const modelo = (id: string) => MODELOS_INSPECAO.find((m) => m.id === id)!
  const respostas = (id: string, nc: number[]) =>
    modelo(id).itens.map((texto, i) => ({ texto, resposta: (nc.includes(i) ? 'NC' : 'C') as 'C' | 'NC', obs: nc.includes(i) ? 'Corrigir' : '' }))
  const inspecoes = [
    { id: 'i1', empresaId: 'e1', modelo: 'obra', titulo: 'Canteiro de obras', local: 'Bloco B', data: d(-7), responsavel: 'Técnico de segurança', itens: respostas('obra', [1, 2]), status: 'Concluída' as const, acoesGeradas: true },
    { id: 'i2', empresaId: 'e2', modelo: 'incendio', titulo: 'Extintores e combate a incêndio', local: 'Galpão principal', data: d(-3), responsavel: 'Técnico de segurança', itens: respostas('incendio', [4]), status: 'Concluída' as const },
    { id: 'i3', empresaId: 'e2', modelo: 'maquinas', titulo: 'Máquinas e equipamentos', local: 'Estamparia', data: h, responsavel: 'Técnico de segurança', itens: modelo('maquinas').itens.map((texto, i) => ({ texto, resposta: (i < 4 ? (i === 1 ? 'NC' : 'C') : '') as 'C' | 'NC' | '', obs: '' })), status: 'Em andamento' as const },
  ]

  const aprs = [
    {
      id: 'r1', empresaId: 'e1', numero: 'APR-001', atividade: 'Montagem de andaime fachadeiro', local: 'Fachada norte – bloco B', data: d(-2),
      responsavel: 'Técnico de segurança', equipe: 'Luciana Ferreira, Rafael Martins', status: 'Aprovada' as const,
      etapas: [
        { etapa: 'Transporte das peças', perigos: 'Peças pesadas e longas', riscos: 'Lesão lombar, prensamento', probabilidade: 3, severidade: 2, medidas: 'Levantamento em dupla, carrinho', epis: 'Luva, botina, capacete' },
        { etapa: 'Montagem dos níveis superiores', perigos: 'Trabalho acima de 2 m', riscos: 'Queda de pessoa', probabilidade: 3, severidade: 5, medidas: 'Linha de vida, ancoragem contínua, área isolada', epis: 'Cinturão paraquedista, talabarte duplo' },
        { etapa: 'Fixação na estrutura', perigos: 'Queda de materiais', riscos: 'Impacto em quem está abaixo', probabilidade: 2, severidade: 4, medidas: 'Isolamento, ferramentas amarradas', epis: 'Capacete com jugular' },
      ],
    },
  ]

  // Investigação de exemplo no acidente da prensa
  ocorrencias[0] = {
    ...ocorrencias[0],
    investigacao: {
      dataInicio: d(-239),
      equipe: 'Técnico de segurança, supervisor da estamparia, membro da CIPA',
      testemunhas: 'Operador da prensa 2',
      sequencia: 'Durante a retirada manual de uma peça presa na matriz, a operadora acionou o pedal com a mão ainda na área de prensagem.',
      porques: [
        'Por que a mão estava na área de prensagem? Para retirar uma peça presa na matriz.',
        'Por que a peça ficou presa? A matriz estava com rebarba acumulada.',
        'Por que havia rebarba? A limpeza da matriz não estava no plano de manutenção.',
        'Por que a prensa acionou com a mão na área? Não havia cortina de luz nem comando bimanual.',
        'Por que não havia proteção? A máquina não passou por apreciação de risco (NR-12).',
      ],
      causas: {
        'Método': 'Retirada de peça sem procedimento e sem ferramenta auxiliar',
        'Máquina': 'Prensa sem cortina de luz / comando bimanual',
        'Mão de obra': 'Treinamento NR-12 sem prática de situações anormais',
      },
      causaRaiz: 'Prensa sem dispositivos de segurança previstos na NR-12 e ausência de procedimento para destravamento de peças.',
      conclusao: 'Acidente evitável. Instalar proteções e criar procedimento de bloqueio antes de qualquer intervenção na matriz.',
      acoesGeradas: true,
      concluida: true,
    },
  }

  const modeloPt = TIPOS_PT.find((t) => t.tipo === 'Trabalho em altura')!
  const pts = [
    {
      id: 'pt1', empresaId: 'e1', numero: 'PT-001', tipo: modeloPt.tipo, atividade: 'Montagem de andaime fachadeiro', local: 'Fachada norte – bloco B',
      data: d(-2), horaInicio: '07:30', horaFim: '17:00', executantes: 'Luciana Ferreira, Rafael Martins', emitente: 'Técnico de segurança', aprNumero: 'APR-001',
      checklist: modeloPt.itens.map((texto) => ({ texto, resposta: 'S' as const })), medicoes: { o2: '', lel: '', h2s: '', co: '' }, observacoes: '', status: 'Encerrada' as const,
    },
  ]

  const requisitos = [
    { id: 'rq1', funcao: 'Eletricista', cursos: ['NR-10 Básico', 'NR-35 Trabalho em altura'] },
    { id: 'rq2', funcao: 'Armador', cursos: ['NR-18 Admissional (construção)', 'NR-35 Trabalho em altura'] },
    { id: 'rq3', funcao: 'Montadora de andaimes', cursos: ['NR-18 Admissional (construção)', 'NR-35 Trabalho em altura'] },
    { id: 'rq4', funcao: 'Pedreiro', cursos: ['NR-18 Admissional (construção)'] },
    { id: 'rq5', funcao: 'Operador de empilhadeira', cursos: ['NR-11 Operador de empilhadeira'] },
    { id: 'rq6', funcao: 'Operadora de prensa', cursos: ['NR-12 Máquinas e equipamentos'] },
    { id: 'rq7', funcao: 'Mecânica de manutenção', cursos: ['NR-10 Básico', 'NR-12 Máquinas e equipamentos', 'NR-33 Espaço confinado (autorizado/vigia)'] },
    { id: 'rq8', funcao: 'Soldador', cursos: ['NR-23 Brigada de incêndio', 'NR-12 Máquinas e equipamentos'] },
  ]

  const ext = (id: string, empresaId: string, numero: string, tipo: string, capacidade: string, local: string, recarga: number, teste: number, inspecao: number) => ({
    id, empresaId, numero, tipo, capacidade, local,
    ultimaRecarga: d(recarga), proximaRecarga: addMeses(d(recarga), 12),
    ultimoTeste: d(teste), proximoTeste: addMeses(d(teste), 60),
    ultimaInspecao: d(inspecao), status: 'Em uso', observacoes: '',
  })
  const extintores = [
    ext('x1', 'e1', 'EXT-01', 'Pó químico ABC', '6 kg', 'Almoxarifado', -300, -700, -12),
    ext('x2', 'e1', 'EXT-02', 'Água pressurizada (AP)', '10 L', 'Bloco B – térreo', -380, -1500, -45),
    ext('x3', 'e1', 'EXT-03', 'CO₂', '6 kg', 'Quadro geral de energia', -200, -1790, -8),
    ext('x4', 'e2', 'EXT-10', 'Pó químico BC', '8 kg', 'Caldeiraria', -100, -400, -20),
    ext('x5', 'e2', 'EXT-11', 'Pó químico ABC', '6 kg', 'Estamparia', -340, -900, -35),
    ext('x6', 'e2', 'EXT-12', 'CO₂', '6 kg', 'Painéis elétricos', -60, -300, -5),
  ]

  const risco = (id: string, empresaId: string, setor: string, funcoes: string, atividade: string, tipo: string, perigo: string, fonte: string, lesoes: string, expostos: number, p: number, s: number, existentes: string, propostas: string) => ({
    id, empresaId, setor, funcoes, atividade, tipo, perigo, fonte, lesoes, expostos,
    probabilidade: ESCALA_PROB[p - 1], severidade: ESCALA_SEV[s - 1],
    medidasExistentes: existentes, medidasPropostas: propostas, responsavel: '', prazo: '',
  })
  const riscos = [
    risco('rs1', 'e1', 'Obras', 'Armador, Montadora de andaimes, Pedreiro', 'Trabalho em fachada e andaimes', 'Acidente', 'Trabalho em altura', 'Andaimes e bordas de laje', 'Fraturas, morte', 12, 3, 5, 'Treinamento NR-35, cinturão, guarda-corpo', 'Linha de vida em todos os pavimentos; inspeção diária de andaimes'),
    risco('rs2', 'e1', 'Obras', 'Pedreiro', 'Corte de blocos e concreto', 'Químico', 'Poeira de sílica', 'Serra de corte a seco', 'Silicose', 6, 3, 4, 'Respirador PFF2', 'Corte a úmido; avaliação quantitativa de poeira'),
    risco('rs3', 'e1', 'Elétrica', 'Eletricista', 'Montagem de quadros provisórios', 'Acidente', 'Choque elétrico', 'Instalações energizadas', 'Queimaduras, parada cardíaca', 2, 2, 5, 'NR-10, bloqueio e etiquetagem', 'Procedimento de desenergização por escrito'),
    risco('rs4', 'e2', 'Estamparia', 'Operadora de prensa, Auxiliar de produção', 'Operação de prensas', 'Acidente', 'Prensamento de mãos', 'Prensas excêntricas', 'Amputação', 8, 3, 5, 'Treinamento NR-12', 'Cortina de luz e comando bimanual (em andamento)'),
    risco('rs5', 'e2', 'Estamparia', 'Operadora de prensa, Auxiliar de produção', 'Operação de prensas', 'Físico', 'Ruído', 'Impacto das prensas', 'Perda auditiva', 8, 4, 3, 'Protetor auricular tipo plug', 'Enclausuramento acústico; audiometria semestral'),
    risco('rs6', 'e2', 'Caldeiraria', 'Soldador', 'Soldagem e esmerilhamento', 'Químico', 'Fumos metálicos', 'Solda MIG', 'Intoxicação, doenças respiratórias', 3, 3, 3, 'Máscara de solda, PFF2', 'Exaustão localizada no posto de solda'),
    risco('rs7', 'e2', 'Logística', 'Operador de empilhadeira', 'Movimentação de cargas', 'Ergonômico', 'Postura e vibração de corpo inteiro', 'Empilhadeira', 'Lombalgia', 2, 2, 2, 'Assento com amortecimento', 'Pausas e AEP do posto'),
  ]

  const cipas = [
    {
      id: 'cp1', empresaId: 'e2', gestao: `${h.slice(0, 4)}/${Number(h.slice(0, 4)) + 1}`, inicio: d(-250), fim: d(115),
      membros: [
        { nome: 'Paulo Henrique', funcao: 'Presidente', representacao: 'Empregador' },
        { nome: 'Fernanda Oliveira', funcao: 'Vice-presidente', representacao: 'Empregados' },
        { nome: 'Patrícia Gomes', funcao: 'Secretário(a)', representacao: 'Empregados' },
        { nome: 'Diego Santos', funcao: 'Titular', representacao: 'Empregados' },
        { nome: 'Marcos Vinícius Rocha', funcao: 'Suplente', representacao: 'Empregados' },
      ],
    },
  ]
  const reuniao = (id: string, dia: number, status: 'Agendada' | 'Realizada', pauta: string, deliberacoes = '') => ({
    id, cipaId: 'cp1', data: d(dia), hora: '14:00', tipo: 'Ordinária', local: 'Sala de reuniões', pauta, deliberacoes,
    presentes: status === 'Realizada' ? ['Paulo Henrique', 'Fernanda Oliveira', 'Patrícia Gomes', 'Diego Santos'] : [], status,
  })
  const reunioes = [
    reuniao('rc1', -40, 'Realizada', 'Análise do incidente da doca 2; andamento das proteções da prensa 3', 'Demarcar corredores da doca 2 em 10 dias; cobrar cronograma da cortina de luz.'),
    reuniao('rc2', -10, 'Realizada', 'Acidente na caldeiraria (projeção nos olhos); campanha de uso de óculos', 'Trocar óculos por ampla visão na caldeiraria; DDS sobre proteção dos olhos.'),
    reuniao('rc3', 20, 'Agendada', 'Mapa de riscos atualizado; preparação da SIPAT'),
  ]

  return {
    empresas, colaboradores, epis, entregas, treinamentos, asos, ocorrencias, acoes, dds, inspecoes, aprs, pts, requisitos, modelos: [], extintores, riscos, cipas, reunioes,
    config: { ...configPadrao(), tecnico: 'Técnico(a) de Segurança (demo)' },
  }
}
