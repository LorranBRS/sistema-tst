# Sistema TST

SaaS web para o dia a dia do **Técnico de Segurança do Trabalho**: EPIs, treinamentos, ASOs, inspeções, APR, acidentes, DDS e plano de ação em um só lugar, com alertas de vencimento e documentos prontos para imprimir.

**Acesse online:** https://lorranbrs.github.io/sistema-tst/

> Versão de demonstração: não precisa de cadastro, já vem com dados de exemplo e salva tudo no navegador (localStorage). Use *Configurações → Baixar backup* para guardar ou levar os dados para outro computador.

## Módulos

| Módulo | O que faz |
|---|---|
| **Painel** | Dias sem acidentes (e recorde), vencimentos de treinamentos/ASOs/CAs/trocas de EPI, ações atrasadas, ocorrências dos últimos 12 meses e conformidade das inspeções |
| **Empresas** | Clientes/unidades com CNPJ, CNAE e grau de risco. Seletor no topo filtra o sistema inteiro por empresa |
| **Colaboradores** | Cadastro com pendências (treinamentos/ASO vencidos) e atalho para a ficha de EPI |
| **EPIs e estoque** | Catálogo com nº e validade do CA, estoque mínimo e vida útil |
| **Entregas de EPI** | Registro de fornecimento (NR-6) com baixa automática de estoque e data da próxima troca |
| **Ficha de EPI** | Ficha de controle pronta para imprimir/assinar, com termo de responsabilidade |
| **Treinamentos** | Cursos por NR com cálculo automático da reciclagem (prazos sugeridos e editáveis) |
| **ASOs** | Admissional, periódico, retorno, mudança de risco e demissional (NR-7) |
| **Inspeções** | Checklists de NR-10, NR-12, NR-18, NR-23, NR-35 e inspeção geral; C/NC/NA, % de conformidade e geração de ações das não conformidades |
| **APR** | Análise Preliminar de Risco por etapas com matriz 5×5, duplicação e impressão com lista de assinaturas |
| **DDS** | Registro dos diálogos e banco com 16 temas prontos (sugestão do dia) |
| **Ocorrências** | Acidentes, incidentes e quase acidentes, dias perdidos, controle de CAT e investigação |
| **Plano de ação** | 5W2H com prioridade, prazo e status |
| **Calculadoras** | TF/TG (NBR 14280), dose de ruído (NR-15 q=5 e NHO-01 q=3), IBUTG e adicionais de insalubridade/periculosidade |
| **NRs** | Lista das NRs com atalho para o texto oficial |
| **Configurações** | Perfil do técnico, antecedência dos alertas, tema claro/escuro, backup/importação |

Todas as listas têm busca, filtros e **exportação CSV** (abre direto no Excel).

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

## Roadmap (planos pagos)

- Login e sincronização na nuvem (multiusuário)
- Assinatura digital do colaborador na entrega de EPI
- Portal do cliente para consultorias
- Relatórios em PDF com a marca da empresa
- Upload de fotos nas inspeções e ocorrências

## Aviso

Prazos de reciclagem, periodicidade de exames e cálculos são **de apoio**. Confira sempre o texto vigente das NRs, o PGR e o PCMSO de cada empresa. Os dados de demonstração são fictícios.
