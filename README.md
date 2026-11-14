# Sistema TST

SaaS web para o dia a dia do **Técnico de Segurança do Trabalho**: EPIs, treinamentos, ASOs, inspeções, APR, acidentes, DDS e plano de ação em um só lugar, com alertas de vencimento e documentos prontos para imprimir.

**Acesse online:** https://lorranbrs.github.io/sistema-tst/

> Versão de demonstração: não precisa de cadastro, já vem com dados de exemplo e salva tudo no navegador (localStorage). Use *Configurações → Baixar backup* para guardar ou levar os dados para outro computador.

## Módulos

| Módulo | O que faz |
|---|---|
| **Painel** | Dias sem acidentes (e recorde), vencimentos de treinamentos/ASOs/CAs/trocas de EPI, ações atrasadas, ocorrências dos últimos 12 meses e conformidade das inspeções |
| **Empresas** | Clientes/unidades com CNPJ, CNAE e grau de risco. Seletor no topo filtra o sistema inteiro por empresa |
| **Colaboradores** | Cadastro com pendências, atalho para a ficha de EPI e importação de planilha (CSV do Excel/Google) |
| **EPIs e estoque** | Catálogo com nº e validade do CA (botão que abre a consulta oficial), estoque mínimo e vida útil |
| **Entregas de EPI** | Registro de fornecimento (NR-6) com baixa automática de estoque e data da próxima troca |
| **Ficha de EPI** | Ficha de controle pronta para imprimir/assinar, com termo de responsabilidade |
| **Treinamentos** | Cursos por NR com cálculo automático da reciclagem (prazos sugeridos e editáveis) |
| **ASOs** | Admissional, periódico, retorno, mudança de risco e demissional (NR-7) |
| **Inspeções** | 9 checklists (NR-10, 11, 12, 13, 17, 18, 23, 35 e geral) e checklists próprios; C/NC/NA, % de conformidade e geração de ações das não conformidades |
| **APR** | Análise Preliminar de Risco por etapas com matriz 5×5, duplicação e impressão com lista de assinaturas |
| **DDS** | Registro dos diálogos e banco com 16 temas prontos (sugestão do dia) |
| **Ocorrências** | Acidentes, incidentes e quase acidentes, dias perdidos, controle de CAT e investigação |
| **Plano de ação** | 5W2H com prioridade, prazo e status |
| **Calculadoras** | TF/TG (NBR 14280), dose de ruído (NR-15 q=5 e NHO-01 q=3), IBUTG e adicionais de insalubridade/periculosidade |
| **NRs** | Lista das NRs com atalho para o texto oficial |
| **Permissão de Trabalho** | PT de altura, trabalho a quente, espaço confinado (com medição de gases), eletricidade e escavação, vinculada à APR |
| **Investigação** | 5 porquês, causas 6M (Ishikawa), causa raiz e geração de ações a partir da ocorrência |
| **Matriz de treinamentos** | Cursos obrigatórios por função e situação de cada colaborador (em dia, a vencer, vencido, falta) |
| **Relatório mensal** | Indicadores, TF/TG do mês e do ano, ocorrências, inspeções, treinamentos, DDS, plano de ação e pendências |
| **Configurações** | Perfil do técnico, seu logo, cor do sistema, antecedência dos alertas, tema claro/escuro, backup/importação |

**Assinatura na tela** (dedo no celular ou mouse): recebimento de EPI na ficha, equipe da APR, executantes da PT, lista de presença do DDS e assinatura do técnico nos documentos.

**App instalável e offline:** o site pode ser instalado no celular ou no computador (PWA) e abre sem internet; os dados ficam no aparelho.

Todas as listas têm busca, filtros e **exportação CSV** (abre direto no Excel). Botões no topo trocam o tema (claro/escuro) e a cor do sistema; os documentos impressos levam o logo da empresa e o do técnico.

## Tela de apresentação

A página de apresentação com recursos e planos (`src/pages/Landing.tsx`) está **desativada**: o endereço abre direto no painel. Para reativar, mude `MOSTRAR_APRESENTACAO` para `true` em [`src/App.tsx`](src/App.tsx).

## Tecnologia

- React 19 + TypeScript + Vite
- Sem backend nesta versão: a camada de dados fica em [`src/lib/store.ts`](src/lib/store.ts) — trocar por uma API (ex.: Supabase) exige mexer só nesse arquivo
- Roteamento por hash (funciona no GitHub Pages sem configuração extra)
- Publicação automática no GitHub Pages a cada push na `main` ([workflow](.github/workflows/deploy.yml))

## Rodar localmente

```bash
npm install
npm run dev
```

Build de produção: `npm run build` (gera a pasta `dist/`).

## Estrutura

```
src/
  lib/          tipos, armazenamento, catálogos (cursos, checklists, DDS, NRs), dados demo, utilidades
  components/   UI base e a página genérica de cadastro (CrudPage)
  pages/        painel, inspeções, APR, ficha de EPI, calculadoras, NRs, configurações, landing
```

## Roadmap

- Login e sincronização na nuvem (multiusuário)
- Assinatura digital do colaborador na entrega de EPI
- Portal do cliente para consultorias
- Relatórios em PDF com a marca da empresa
- Upload de fotos nas inspeções e ocorrências

## Aviso

Prazos de reciclagem, periodicidade de exames e cálculos são **de apoio**. Confira sempre o texto vigente das NRs, o PGR e o PCMSO de cada empresa. Os dados de demonstração são fictícios.
