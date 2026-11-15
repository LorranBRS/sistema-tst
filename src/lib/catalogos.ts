// Catálogos de apoio: cursos, modelos de inspeção, temas de DDS e lista de NRs.
// Prazos são SUGESTÕES de mercado — o técnico deve conferir o texto vigente da NR,
// o PGR e o PCMSO de cada empresa. Todos os prazos podem ser editados no cadastro.

export interface Curso {
  nome: string
  meses: number // 0 = sem reciclagem periódica definida
  cargaHoraria: number
}

export const CURSOS: Curso[] = [
  { nome: 'NR-05 CIPA', meses: 12, cargaHoraria: 20 },
  { nome: 'NR-06 Uso e conservação de EPI', meses: 12, cargaHoraria: 2 },
  { nome: 'NR-10 Básico', meses: 24, cargaHoraria: 40 },
  { nome: 'NR-10 SEP', meses: 24, cargaHoraria: 40 },
  { nome: 'NR-11 Operador de empilhadeira', meses: 12, cargaHoraria: 16 },
  { nome: 'NR-12 Máquinas e equipamentos', meses: 24, cargaHoraria: 8 },
  { nome: 'NR-18 Admissional (construção)', meses: 24, cargaHoraria: 4 },
  { nome: 'NR-20 Inflamáveis e combustíveis', meses: 24, cargaHoraria: 16 },
  { nome: 'NR-23 Brigada de incêndio', meses: 12, cargaHoraria: 16 },
  { nome: 'NR-33 Espaço confinado (autorizado/vigia)', meses: 12, cargaHoraria: 16 },
  { nome: 'NR-33 Supervisor de entrada', meses: 12, cargaHoraria: 40 },
  { nome: 'NR-35 Trabalho em altura', meses: 24, cargaHoraria: 8 },
  { nome: 'Primeiros socorros', meses: 12, cargaHoraria: 8 },
  { nome: 'Direção defensiva', meses: 24, cargaHoraria: 8 },
]

export const TIPOS_ASO = [
  { nome: 'Admissional', meses: 12 },
  { nome: 'Periódico', meses: 12 },
  { nome: 'Retorno ao trabalho', meses: 12 },
  { nome: 'Mudança de risco', meses: 12 },
  { nome: 'Monitoração pontual', meses: 0 },
  { nome: 'Demissional', meses: 0 },
]

export const MOTIVOS_ENTREGA = ['Primeira entrega', 'Troca por desgaste', 'Troca por vencimento', 'Perda', 'Dano']

export const TIPOS_OCORRENCIA = [
  'Acidente típico',
  'Acidente de trajeto',
  'Doença ocupacional',
  'Incidente (dano material)',
  'Quase acidente',
]

export const GRAVIDADES = ['Sem lesão', 'Sem afastamento', 'Com afastamento', 'Fatal']

/** Tipos que contam como acidente para "dias sem acidentes" e taxas. */
export const TIPOS_ACIDENTE = ['Acidente típico', 'Acidente de trajeto', 'Doença ocupacional']

export interface ModeloInspecao {
  id: string
  nome: string
  nr: string
  itens: string[]
}

export const MODELOS_INSPECAO: ModeloInspecao[] = [
  {
    id: 'incendio',
    nome: 'Extintores e combate a incêndio',
    nr: 'NR-23',
    itens: [
      'Extintor no local indicado e sinalizado',
      'Acesso ao extintor desobstruído',
      'Lacre e pino de segurança intactos',
      'Manômetro na faixa de operação (verde)',
      'Recarga dentro do prazo de validade',
      'Teste hidrostático dentro do prazo',
      'Mangueira, difusor e corpo sem danos',
      'Hidrantes e mangotinhos em condições de uso',
      'Rotas de fuga sinalizadas e desobstruídas',
      'Iluminação de emergência funcionando',
    ],
  },
  {
    id: 'altura',
    nome: 'Trabalho em altura',
    nr: 'NR-35',
    itens: [
      'Análise de risco e permissão de trabalho emitidas',
      'Trabalhadores capacitados e com ASO apto para altura',
      'Cinturão tipo paraquedista inspecionado antes do uso',
      'Talabarte / trava-quedas adequados à atividade',
      'Ponto de ancoragem definido e com resistência adequada',
      'Área abaixo isolada e sinalizada',
      'Plano de resgate disponível e equipe ciente',
      'Condições climáticas adequadas (vento, chuva)',
      'Escadas e andaimes íntegros e bem fixados',
      'Ferramentas presas para evitar queda de objetos',
    ],
  },
  {
    id: 'maquinas',
    nome: 'Máquinas e equipamentos',
    nr: 'NR-12',
    itens: [
      'Proteções fixas instaladas nas zonas de perigo',
      'Proteções móveis com intertravamento funcionando',
      'Botão de parada de emergência acessível e funcional',
      'Partida protegida contra acionamento acidental',
      'Sinalização dos riscos na máquina',
      'Manual ou procedimento de operação disponível',
      'Operador capacitado e autorizado',
      'Aterramento elétrico da máquina',
      'Manutenção preventiva registrada',
      'Área de circulação demarcada e livre',
    ],
  },
  {
    id: 'eletrica',
    nome: 'Instalações elétricas',
    nr: 'NR-10',
    itens: [
      'Quadros elétricos fechados, identificados e sinalizados',
      'Diagrama unifilar atualizado disponível',
      'Ausência de fios expostos ou emendas inadequadas',
      'Sistema de aterramento existente e íntegro',
      'Dispositivos de bloqueio e etiquetagem disponíveis',
      'Somente trabalhadores autorizados em intervenções',
      'Vestimenta e EPIs adequados ao risco elétrico',
      'Prontuário das instalações elétricas (quando exigido)',
      'Área frontal dos quadros desobstruída',
      'Extintor adequado (classe C) próximo aos quadros',
    ],
  },
  {
    id: 'obra',
    nome: 'Canteiro de obras',
    nr: 'NR-18',
    itens: [
      'Áreas de vivência limpas e adequadas',
      'Proteção coletiva contra quedas (guarda-corpo, rodapé)',
      'Aberturas no piso fechadas ou protegidas',
      'Andaimes montados conforme projeto e inspecionados',
      'Escavações escoradas ou taludadas',
      'Materiais armazenados de forma organizada e estável',
      'Sinalização de segurança no canteiro',
      'Trabalhadores usando os EPIs exigidos',
      'Ferramentas manuais e elétricas em bom estado',
      'Instalações elétricas provisórias protegidas',
    ],
  },
  {
    id: 'geral',
    nome: 'Inspeção geral de segurança',
    nr: 'NR-01',
    itens: [
      'Uso correto de capacete pelos trabalhadores',
      'Uso de óculos de proteção nas atividades com projeção',
      'Uso de protetor auditivo em áreas ruidosas',
      'Uso de luvas adequadas à atividade',
      'Calçado de segurança em uso',
      'EPIs em bom estado de conservação',
      'Fichas de EPI assinadas e atualizadas',
      'Ordem e limpeza dos postos de trabalho',
      'Sinalização de segurança visível',
      'Kit de primeiros socorros completo',
    ],
  },
  {
    id: 'empilhadeira',
    nome: 'Empilhadeira',
    nr: 'NR-11',
    itens: [
      'Operador capacitado, autorizado e com identificação visível',
      'Checklist diário pré-uso preenchido',
      'Freios de serviço e de estacionamento funcionando',
      'Buzina e alarme sonoro de ré funcionando',
      'Luzes, faróis e giroflex funcionando',
      'Garfos, correntes e torre sem trincas ou desgaste excessivo',
      'Cinto de segurança e protetor do operador (santo antônio) instalados',
      'Pneus em bom estado e sem vazamentos de óleo ou gás',
      'Capacidade de carga indicada em local visível',
      'Corredores demarcados e área de circulação livre',
    ],
  },
  {
    id: 'caldeiras',
    nome: 'Caldeiras e vasos de pressão',
    nr: 'NR-13',
    itens: [
      'Placa de identificação visível e legível',
      'Prontuário e registro de segurança disponíveis',
      'Válvula de segurança com pressão de abertura ajustada e lacrada',
      'Manômetro instalado, legível e calibrado',
      'Inspeção de segurança periódica dentro do prazo',
      'Operador com treinamento específico (caldeiras)',
      'Ausência de vazamentos, corrosão ou deformações aparentes',
      'Casa de caldeiras com saídas desobstruídas e ventilação',
      'Dispositivos de controle e alarme de nível funcionando',
      'Procedimentos de operação e emergência disponíveis',
    ],
  },
  {
    id: 'ergonomia',
    nome: 'Ergonomia do posto de trabalho',
    nr: 'NR-17',
    itens: [
      'Altura da bancada ou mesa compatível com a tarefa e o trabalhador',
      'Cadeira com regulagem de altura e apoio lombar',
      'Monitor na altura dos olhos e a um braço de distância',
      'Ferramentas e materiais ao alcance, sem torção do tronco',
      'Levantamento manual de cargas dentro dos limites e com auxílio quando necessário',
      'Pausas previstas em atividades repetitivas',
      'Iluminação adequada ao posto',
      'Conforto térmico e ruído compatíveis com a atividade',
      'Trabalho em pé com possibilidade de alternância de postura',
      'Avaliação ergonômica preliminar (AEP) realizada',
    ],
  },
]

export const TEMAS_DDS: { tema: string; texto: string }[] = [
  { tema: 'Uso correto do EPI', texto: 'O EPI só protege se for o adequado ao risco, estiver em bom estado e for usado do jeito certo durante toda a atividade. Avise o encarregado sempre que um EPI estiver danificado.' },
  { tema: 'Trabalho em altura', texto: 'Acima de 2 metros com risco de queda, só com treinamento, ASO apto, análise de risco e cinturão ancorado. Nunca improvise ancoragem em tubulações ou estruturas sem avaliação.' },
  { tema: 'Ordem e limpeza', texto: 'Materiais fora do lugar causam tropeços, quedas e cortes. Ao final de cada tarefa, recolha sobras, guarde ferramentas e deixe as passagens livres.' },
  { tema: 'Riscos elétricos', texto: 'Só profissionais autorizados intervêm em instalações elétricas. Antes de qualquer serviço: desligar, bloquear, etiquetar e testar a ausência de tensão.' },
  { tema: 'Levantamento manual de cargas', texto: 'Dobre os joelhos, mantenha a coluna reta e a carga perto do corpo. Peça ajuda ou use equipamento quando a carga for pesada ou volumosa.' },
  { tema: 'Prevenção de incêndios', texto: 'Conheça a localização dos extintores e as rotas de fuga. Não obstrua equipamentos de combate e saiba qual classe de extintor usar em cada tipo de fogo.' },
  { tema: 'Comunicação de quase acidentes', texto: 'Todo quase acidente é um aviso. Comunicar ajuda a corrigir a causa antes que alguém se machuque — ninguém é punido por relatar.' },
  { tema: 'Proteção auditiva', texto: 'A perda auditiva por ruído é permanente e silenciosa. Use o protetor durante toda a exposição e higienize o plug ou concha regularmente.' },
  { tema: 'Máquinas e proteções', texto: 'Nunca retire ou burle uma proteção de máquina. Se a proteção atrapalha o trabalho, comunique — existe sempre uma solução segura.' },
  { tema: 'Ferramentas manuais', texto: 'Use a ferramenta certa para cada serviço e inspecione antes do uso. Ferramenta improvisada ou danificada é causa frequente de lesões nas mãos.' },
  { tema: 'Espaço confinado', texto: 'Entrada só com permissão, medição de gases, vigia do lado de fora e plano de resgate. A atmosfera pode mudar em minutos.' },
  { tema: 'Produtos químicos', texto: 'Leia a FDS e o rótulo antes de manusear. Use os EPIs indicados, mantenha os recipientes identificados e nunca misture produtos.' },
  { tema: 'Calor e hidratação', texto: 'Em dias quentes, beba água com frequência, faça pausas à sombra e fique atento a tontura, dor de cabeça e cãibras — sinais de estresse térmico.' },
  { tema: 'Direção segura', texto: 'Cinto sempre, celular nunca ao volante e respeito aos limites de velocidade. A maioria dos acidentes de trajeto é evitável.' },
  { tema: 'Saúde mental e fadiga', texto: 'Cansaço e preocupação reduzem a atenção. Durma bem, fale com a liderança se não estiver em condições e cuide dos colegas.' },
  { tema: 'Sinalização de segurança', texto: 'Cores e placas comunicam riscos e obrigações. Respeite isolamentos, não remova placas e avise quando a sinalização estiver faltando.' },
]

/** Consulta pública de CA do Ministério do Trabalho (não há API aberta para consulta automática). */
export const CAEPI_URL = 'https://caepi.trabalho.gov.br/internet/ConsultaCAInternet.aspx'

/** Cores principais disponíveis (claro / escuro). */
export const CORES: { id: string; nome: string; claro: [string, string, string]; escuro: [string, string, string] }[] = [
  { id: 'verde', nome: 'Verde', claro: ['#15803d', '#116932', '#e3f4e9'], escuro: ['#22a35a', '#2bbd69', '#16301f'] },
  { id: 'azul', nome: 'Azul', claro: ['#1d4ed8', '#1e40af', '#e6edfd'], escuro: ['#5b8cf5', '#7aa2f7', '#17233f'] },
  { id: 'laranja', nome: 'Laranja', claro: ['#c2410c', '#9a3412', '#fdeee5'], escuro: ['#f07a3a', '#f59157', '#3a2015'] },
  { id: 'roxo', nome: 'Roxo', claro: ['#7c3aed', '#6d28d9', '#f0e9fe'], escuro: ['#a07af7', '#b496f8', '#271a40'] },
  { id: 'vermelho', nome: 'Vermelho', claro: ['#b91c1c', '#991b1b', '#fdeaea'], escuro: ['#ef6262', '#f37f7f', '#3a1717'] },
  { id: 'grafite', nome: 'Grafite', claro: ['#374151', '#1f2937', '#eceef1'], escuro: ['#9ca3af', '#b8bec7', '#252a31'] },
]

export const NRS_URL =
  'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes'

export const NRS: { n: number; titulo: string; revogada?: boolean; modulo?: { rota: string; nome: string } }[] = [
  { n: 1, titulo: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais', modulo: { rota: '/app/pgr', nome: 'Inventário de riscos' } },
  { n: 2, titulo: 'Inspeção Prévia', revogada: true },
  { n: 3, titulo: 'Embargo e Interdição' },
  { n: 4, titulo: 'Serviços Especializados em Segurança e em Medicina do Trabalho (SESMT)' },
  { n: 5, titulo: 'Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA)', modulo: { rota: '/app/cipa', nome: 'CIPA' } },
  { n: 6, titulo: 'Equipamentos de Proteção Individual (EPI)', modulo: { rota: '/app/epis', nome: 'EPIs' } },
  { n: 7, titulo: 'Programa de Controle Médico de Saúde Ocupacional (PCMSO)', modulo: { rota: '/app/asos', nome: 'ASOs' } },
  { n: 8, titulo: 'Edificações' },
  { n: 9, titulo: 'Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos', modulo: { rota: '/app/calculadoras', nome: 'Calculadoras' } },
  { n: 10, titulo: 'Segurança em Instalações e Serviços em Eletricidade', modulo: { rota: '/app/inspecoes', nome: 'Inspeções' } },
  { n: 11, titulo: 'Transporte, Movimentação, Armazenagem e Manuseio de Materiais' },
  { n: 12, titulo: 'Segurança no Trabalho em Máquinas e Equipamentos', modulo: { rota: '/app/inspecoes', nome: 'Inspeções' } },
  { n: 13, titulo: 'Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento' },
  { n: 14, titulo: 'Fornos' },
  { n: 15, titulo: 'Atividades e Operações Insalubres', modulo: { rota: '/app/calculadoras', nome: 'Calculadoras' } },
  { n: 16, titulo: 'Atividades e Operações Perigosas', modulo: { rota: '/app/calculadoras', nome: 'Calculadoras' } },
  { n: 17, titulo: 'Ergonomia' },
  { n: 18, titulo: 'Segurança e Saúde no Trabalho na Indústria da Construção', modulo: { rota: '/app/inspecoes', nome: 'Inspeções' } },
  { n: 19, titulo: 'Explosivos' },
  { n: 20, titulo: 'Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis' },
  { n: 21, titulo: 'Trabalhos a Céu Aberto' },
  { n: 22, titulo: 'Segurança e Saúde Ocupacional na Mineração' },
  { n: 23, titulo: 'Proteção Contra Incêndios', modulo: { rota: '/app/extintores', nome: 'Extintores' } },
  { n: 24, titulo: 'Condições Sanitárias e de Conforto nos Locais de Trabalho' },
  { n: 25, titulo: 'Resíduos Industriais' },
  { n: 26, titulo: 'Sinalização de Segurança' },
  { n: 27, titulo: 'Registro Profissional do Técnico de Segurança do Trabalho', revogada: true },
  { n: 28, titulo: 'Fiscalização e Penalidades' },
  { n: 29, titulo: 'Segurança e Saúde no Trabalho Portuário' },
  { n: 30, titulo: 'Segurança e Saúde no Trabalho Aquaviário' },
  { n: 31, titulo: 'Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura' },
  { n: 32, titulo: 'Segurança e Saúde no Trabalho em Serviços de Saúde' },
  { n: 33, titulo: 'Segurança e Saúde nos Trabalhos em Espaços Confinados', modulo: { rota: '/app/treinamentos', nome: 'Treinamentos' } },
  { n: 34, titulo: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval' },
  { n: 35, titulo: 'Trabalho em Altura', modulo: { rota: '/app/equipamentos', nome: 'Equipamentos' } },
  { n: 36, titulo: 'Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados' },
  { n: 37, titulo: 'Segurança e Saúde em Plataformas de Petróleo' },
  { n: 38, titulo: 'Segurança e Saúde no Trabalho nas Atividades de Limpeza Urbana e Manejo de Resíduos Sólidos' },
]

/** Nível de risco da matriz 5x5 (probabilidade x severidade). */
export function nivelRisco(p: number, s: number) {
  const v = p * s
  if (v >= 15) return { valor: v, nome: 'Crítico', cls: 'critico' }
  if (v >= 10) return { valor: v, nome: 'Alto', cls: 'alto' }
  if (v >= 5) return { valor: v, nome: 'Moderado', cls: 'moderado' }
  return { valor: v, nome: 'Baixo', cls: 'baixo' }
}

/* ---------- Permissão de Trabalho ---------- */
export const TIPOS_PT: { tipo: string; nr: string; medicoes?: boolean; itens: string[] }[] = [
  {
    tipo: 'Trabalho em altura',
    nr: 'NR-35',
    itens: [
      'APR da atividade realizada e divulgada à equipe',
      'Trabalhadores capacitados (NR-35) e com ASO apto para altura',
      'Cinturão paraquedista e talabarte inspecionados',
      'Ponto de ancoragem / linha de vida definido e adequado',
      'Área abaixo isolada e sinalizada',
      'Plano de resgate e equipe de resgate disponíveis',
      'Condições climáticas favoráveis (sem chuva forte ou vento)',
      'Escada, andaime ou PTA inspecionados',
      'Ferramentas e materiais presos contra queda',
    ],
  },
  {
    tipo: 'Trabalho a quente',
    nr: 'NR-18 / NR-20',
    itens: [
      'Materiais combustíveis removidos ou protegidos ao redor',
      'Atmosfera verificada: ausência de gases ou vapores inflamáveis',
      'Extintor adequado posicionado no local',
      'Vigia de fogo designado durante e após o serviço',
      'Equipamento de solda/corte inspecionado (cabos, mangueiras, válvulas corta-chama)',
      'Biombos ou anteparos instalados para proteger terceiros',
      'EPIs de soldador em uso (máscara, avental, luvas, perneiras)',
      'Ronda no local após o término do serviço',
    ],
  },
  {
    tipo: 'Espaço confinado',
    nr: 'NR-33',
    medicoes: true,
    itens: [
      'Espaço confinado identificado e sinalizado',
      'Supervisor de entrada, vigia e trabalhadores autorizados capacitados',
      'ASO apto para trabalho em espaço confinado',
      'Bloqueio e etiquetagem de energias, fluidos e agitadores',
      'Ventilação / exaustão adequada instalada',
      'Medição de gases antes da entrada e monitoramento contínuo',
      'Comunicação definida entre vigia e entrantes',
      'Equipamentos de resgate disponíveis no local (tripé, guincho)',
      'Iluminação e equipamentos adequados à atmosfera (à prova de explosão, se necessário)',
    ],
  },
  {
    tipo: 'Serviço em eletricidade',
    nr: 'NR-10',
    itens: [
      'Trabalhadores autorizados conforme NR-10',
      'Seccionamento do circuito',
      'Impedimento de reenergização (bloqueio e etiquetagem)',
      'Constatação da ausência de tensão',
      'Aterramento temporário com equipotencialização',
      'Proteção dos elementos energizados na zona controlada',
      'Sinalização de impedimento de reenergização',
      'Ferramentas isoladas, EPIs e vestimenta adequados',
    ],
  },
  {
    tipo: 'Escavação',
    nr: 'NR-18',
    itens: [
      'Interferências subterrâneas identificadas (redes, cabos, tubulações)',
      'Escoramento ou talude conforme projeto',
      'Material escavado afastado da borda',
      'Acesso seguro por escada ou rampa',
      'Bordas sinalizadas e com barreiras',
      'Inspeção da vala antes de cada jornada',
    ],
  },
]

/** Faixas de referência para medição de gases (espaço confinado). */
export const REF_GASES = {
  o2: 'O₂ entre 19,5% e 23,0%',
  lel: 'Inflamáveis abaixo de 10% do LIE',
  h2s: 'H₂S até 8 ppm (LT NR-15)',
  co: 'CO até 39 ppm (LT NR-15)',
}

/* ---------- Extintores ---------- */
export const TIPOS_EXTINTOR = ['Água pressurizada (AP)', 'Pó químico BC', 'Pó químico ABC', 'CO₂', 'Espuma mecânica', 'Classe K (cozinha)']
export const ITENS_INSPECAO_EXTINTOR = [
  'Extintor no local indicado e sinalizado',
  'Acesso desobstruído',
  'Lacre e pino de segurança intactos',
  'Manômetro na faixa verde (quando houver)',
  'Mangueira, difusor e corpo sem danos',
  'Etiqueta/selo de manutenção legível',
]

/* ---------- Inventário de riscos (PGR) ---------- */
export const TIPOS_RISCO = ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Acidente']
export const ESCALA_PROB = ['1 – Rara', '2 – Improvável', '3 – Possível', '4 – Provável', '5 – Quase certa']
export const ESCALA_SEV = ['1 – Insignificante', '2 – Leve', '3 – Moderada', '4 – Grave', '5 – Catastrófica']
export const CORES_RISCO: Record<string, string> = { Físico: '#16a34a', Químico: '#dc2626', Biológico: '#92400e', Ergonômico: '#ca8a04', Acidente: '#2563eb' }

/* ---------- Equipamentos ---------- */
export const TIPOS_EQUIPAMENTO: { tipo: string; dias: number }[] = [
  { tipo: 'Cinturão paraquedista', dias: 30 },
  { tipo: 'Talabarte', dias: 30 },
  { tipo: 'Trava-quedas', dias: 30 },
  { tipo: 'Linha de vida', dias: 30 },
  { tipo: 'Escada', dias: 90 },
  { tipo: 'Andaime', dias: 7 },
  { tipo: 'Detector de gases', dias: 1 },
  { tipo: 'Dosímetro de ruído', dias: 180 },
  { tipo: 'Medidor de stress térmico', dias: 180 },
  { tipo: 'Tripé / guincho de resgate', dias: 30 },
  { tipo: 'Ferramenta isolada', dias: 90 },
  { tipo: 'Outro', dias: 30 },
]

/* ---------- Brigada e simulados ---------- */
export const TIPOS_SIMULADO = ['Abandono de área', 'Combate a princípio de incêndio', 'Primeiros socorros', 'Resgate em altura', 'Resgate em espaço confinado', 'Vazamento de produto químico']

/* ---------- Ordem de Serviço (textos-padrão editáveis) ---------- */
export const OS_PADRAO = {
  obrigacoes: 'Cumprir as normas de segurança e os procedimentos da empresa; usar corretamente os EPIs fornecidos e zelar por sua conservação; participar dos treinamentos e DDS; comunicar imediatamente ao superior qualquer condição de risco, incidente ou acidente; submeter-se aos exames médicos previstos no PCMSO.',
  proibicoes: 'Executar atividades para as quais não foi treinado ou autorizado; remover ou burlar proteções de máquinas e dispositivos de segurança; trabalhar sob efeito de álcool ou drogas; fumar em locais não permitidos; usar celular durante a operação de máquinas e equipamentos.',
  emergencia: 'Em caso de incêndio ou emergência, acionar o alarme, seguir as rotas de fuga sinalizadas e dirigir-se ao ponto de encontro. Em caso de acidente, comunicar imediatamente o superior e o SESMT/brigada.',
}

/* ---------- Terceiros ---------- */
export const DOCS_EMPRESA_TERCEIRO = ['PGR', 'PCMSO', 'Cartão CNPJ', 'Contrato de prestação de serviço', 'Seguro de vida em grupo', 'ART / responsável técnico']
export const DOCS_TRAB_TERCEIRO = ['ASO', 'Integração de segurança', 'Ficha de EPI', 'Ordem de serviço', 'NR-10', 'NR-11', 'NR-12', 'NR-18', 'NR-20', 'NR-33', 'NR-35']

/* ---------- Produtos químicos (GHS) ---------- */
export const PICTOGRAMAS_GHS: { cod: string; nome: string; simbolo: string }[] = [
  { cod: 'GHS01', nome: 'Explosivo', simbolo: '💥' },
  { cod: 'GHS02', nome: 'Inflamável', simbolo: '🔥' },
  { cod: 'GHS03', nome: 'Oxidante', simbolo: '⭕' },
  { cod: 'GHS04', nome: 'Gás sob pressão', simbolo: '🛢️' },
  { cod: 'GHS05', nome: 'Corrosivo', simbolo: '🧪' },
  { cod: 'GHS06', nome: 'Toxicidade aguda', simbolo: '☠️' },
  { cod: 'GHS07', nome: 'Irritante / nocivo', simbolo: '❗' },
  { cod: 'GHS08', nome: 'Perigo à saúde', simbolo: '🫁' },
  { cod: 'GHS09', nome: 'Perigo ao meio ambiente', simbolo: '🐟' },
]
/** Rótulo usado no cadastro ("GHS02 – Inflamável"); o código são os 5 primeiros caracteres. */
export const rotuloGhs = (cod: string) => {
  const p = PICTOGRAMAS_GHS.find((x) => x.cod === cod.slice(0, 5))
  return p ? `${p.cod} – ${p.nome}` : cod
}
/** Combinações que não devem ser armazenadas juntas sem segregação (alerta simplificado — confira a seção 7 e 10 da FDS). */
export const INCOMPATIVEIS: [string, string, string][] = [
  ['GHS03', 'GHS02', 'oxidantes intensificam a queima de inflamáveis'],
  ['GHS01', 'GHS02', 'explosivos não devem ficar junto de inflamáveis'],
  ['GHS01', 'GHS03', 'explosivos não devem ficar junto de oxidantes'],
  ['GHS03', 'GHS05', 'oxidantes podem reagir com corrosivos'],
]

/* ---------- CIPA ---------- */
export const FUNCOES_CIPA = ['Presidente', 'Vice-presidente', 'Secretário(a)', 'Titular', 'Suplente']

/* ---------- Investigação de acidentes ---------- */
export const CATEGORIAS_6M = ['Método', 'Mão de obra', 'Máquina', 'Material', 'Meio ambiente', 'Medição']
