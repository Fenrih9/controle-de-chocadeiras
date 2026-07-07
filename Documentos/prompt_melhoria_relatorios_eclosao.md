# PROMPT DE EXECUÇÃO — Reformulação da Página de Relatórios (Sistema de Controle de Eclosão)

> Copie este documento inteiro e cole no DeepSeek V4 Flash. Antes de enviar, preencha a seção **0. Contexto Técnico** com as informações do seu projeto (stack, arquivo/rota atual, biblioteca de gráficos etc.).

---

## 0. Contexto Técnico (PREENCHER ANTES DE ENVIAR)

```
Stack frontend: [ex: React + Vite / Next.js / outro]
Biblioteca de gráficos atual: [ex: Recharts, Chart.js, ApexCharts, nenhuma]
Backend/fonte de dados: [ex: Supabase, API REST própria, outro]
Arquivo(s) da página atual: [caminho(s) do componente de relatórios]
Framework de estilo: [Tailwind, CSS puro, styled-components, outro]
Existe endpoint/RPC pronto para as métricas abaixo, ou precisa ser criado do zero: [responder]
```

---

## 1. Papel e Objetivo

Você é um engenheiro de produto sênior especializado em dashboards analíticos e UX de dados. Sua tarefa é **reformular a página "Relatório Geral Consolidado" de um sistema de controle de eclosão de chocadeiras (aviário)**, tornando-a clara, confiável e realmente utilizável no dia a dia por um administrador de granja/incubatório — não apenas visualmente bonita.

Não adicione funcionalidades fora do escopo abaixo. Não refatore código não relacionado a esta página.

---

## 2. Diagnóstico dos Problemas Atuais

A página atual tem os seguintes problemas identificados (corrija todos):

1. **Métricas conceitualmente confusas e redundantes.** "Taxa Fertilidade" aparece como 100% enquanto "Eclosão Absoluta" e "Eclodibilidade Real" mostram o mesmo valor (16%) entre si. Isso indica que a fertilidade não está sendo capturada de fato no fluxo de dados (todo ovo incubado está sendo tratado como fértil por padrão), fazendo duas métricas ficarem redundantes e a terceira perder sentido. É necessário corrigir a captura/cálculo, não só o layout.
2. **Gráfico de evolução temporal ilegível.** Poucos meses concentram quase todo o volume (ex: Junho e Julho), enquanto os demais ficam zerados — o gráfico de barras em escala linear faz isso parecer erro visual e desperdiça a maior parte do espaço com meses vazios.
3. **Hierarquia visual fraca.** Cards com dado real (ex: "Galinha") e cards sem dado ("sem incubação") têm o mesmo peso visual, dificultando leitura rápida.
4. **Filtros sem feedback de estado.** Não fica claro quando um filtro está de fato aplicado, nem há indicação de "resultados filtrados" vs. "total geral".
5. **Ausência de contexto comparativo.** Nenhum número tem comparação (período anterior, meta, média histórica), o que impede interpretar se 16% de eclosão é bom, ruim ou normal para a operação.
6. **Terminologia tecnicamente incorreta ou pouco padronizada** para o domínio de incubação avícola.

---

## 3. Correção Conceitual das Métricas (obrigatório)

Implemente as métricas com as fórmulas corretas e nomes claros. Troque os rótulos atuais por estes:

| Métrica | Fórmula | Observação |
|---|---|---|
| **Ovos Incubados** | Total de ovos que entraram em incubação no período | Métrica de volume, não de eficiência |
| **Taxa de Fertilidade** | (Ovos Férteis ÷ Ovos Incubados) × 100 | Só deve existir se houver captura real de infertilidade (ovo claro/infértil) no cadastro. Se o sistema não registra isso hoje, sinalizar como "Dado não disponível" em vez de assumir 100% |
| **Taxa de Eclosão (sobre incubados)** | (Nascidos ÷ Ovos Incubados) × 100 | Eficiência bruta do lote |
| **Eclodibilidade (sobre férteis)** | (Nascidos ÷ Ovos Férteis) × 100 | Só calcular se Taxa de Fertilidade for um dado real; caso contrário, ocultar este card em vez de duplicar o valor da Taxa de Eclosão |
| **Perdas na Incubação** | Ovos Incubados − Nascidos | Card adicional recomendado — hoje inexistente e é a métrica mais acionável para o usuário |

Regra de exibição: **nunca mostrar dois cards com valores idênticos e nomes diferentes**. Se as fontes de dados não permitem diferenciar fertilidade de eclosão, exiba apenas um card de eficiência e um aviso "ative o registro de fertilidade para habilitar esta métrica".

---

## 4. Nova Arquitetura da Página

Organize em blocos, nesta ordem de prioridade de leitura:

### 4.1 Cabeçalho de contexto
- Título, subtítulo, data de sincronização (manter).
- Adicionar: comparação textual curta do período selecionado vs. anterior (ex: "▲ 4pp vs. mês anterior").

### 4.2 Filtros com feedback de estado
- Manter Período / Chocadeira / Espécie.
- Ao aplicar qualquer filtro diferente do padrão, mostrar um chip/badge visível (ex: "Filtros ativos: Junho/2026, Chocadeira 1") com botão "Limpar filtros".
- Filtros devem atualizar todos os blocos abaixo, incluindo os cards de KPI.

### 4.3 KPIs principais (cards)
- Usar exatamente as métricas corrigidas da seção 3.
- Cada card deve ter: valor atual, rótulo claro, e um indicador de tendência (↑/↓/=) comparando ao período anterior equivalente.
- Cards sem dado suficiente devem exibir estado vazio explícito ("Sem dados suficientes no período") em vez de 0% ou 100% enganosos.

### 4.4 Evolução temporal (gráfico)
- Se o período selecionado tiver poucos meses com dado (como no caso atual: só Jun/Jul), **não usar gráfico de barras em linha do tempo anual fixa**. Em vez disso:
  - Se houver ≤ 3 pontos de dado: usar comparação em cards/tabela lado a lado.
  - Se houver > 3 pontos: manter gráfico, mas com eixo Y começando do maior valor relevante (evitar zero-padding excessivo) e agrupar/ocultar meses sem dado ao invés de exibi-los vazios ocupando espaço.
- Manter toggle Incubados/Nascidos/Perdidos, mas garantir contraste de cor acessível entre as 3 séries.
- Adicionar tooltip ao passar o mouse/tocar na barra, mostrando os 3 valores (incubados, nascidos, perdidos) daquele mês.

### 4.5 Rendimento por espécie
- Ordenar por volume decrescente (espécie com dado real primeiro — já está correto).
- Separar visualmente espécies "sem incubação" (cor neutra, menor destaque) das que têm dado real (cor de destaque).
- Adicionar taxa de eclosão por espécie ao lado do "X nascidos de Y ovos" (hoje só mostra números absolutos, sem %).

### 4.6 Eficiência por chocadeira/estufa
- Manter comparação entre chocadeiras, mas ordenar da maior para a menor taxa de eclosão.
- Adicionar contagem de ciclos/lotes rodados por chocadeira, para contextualizar se 12% é 1 lote ruim ou uma média de vários.
- Sinalizar visualmente (cor de alerta) chocadeiras abaixo de um limiar configurável (ex: <20% de eclosão) para chamar atenção operacional.

---

## 5. Estados Vazios e Tratamento de Erros

- Nunca exibir "0%" ou "100%" quando não há dado suficiente — sempre distinguir "sem dado" de "resultado real ruim/bom".
- Se um filtro retornar zero registros, mostrar mensagem clara com sugestão de ação (ex: "Nenhum ciclo encontrado para este filtro. Tente ampliar o período.").

---

## 6. Requisitos Técnicos Gerais

- Reutilizar o design system/tokens de cor já existentes no projeto (não inventar nova paleta).
- Componentizar: KPI Card, Chart Block, Species Ranking Card, Chocadeira Efficiency Card devem ser componentes isolados e reutilizáveis.
- Cálculos de métricas devem vir de uma única fonte de verdade (hook/serviço), nunca duplicados entre front e back.
- Responsivo: a página deve continuar legível em mobile (o layout atual em cards já ajuda, preservar isso).
- Não alterar rotas, navegação lateral ou autenticação — escopo é exclusivamente o conteúdo desta página de relatórios.

---

## 7. Entregáveis Esperados

1. Lista de mudanças propostas por bloco (antes de codar), para validação.
2. Código dos componentes reformulados.
3. Se aplicável, migração/ajuste no cálculo de métricas no backend (apontar claramente o que precisa mudar na fonte de dados, especialmente sobre captura de fertilidade).
4. Checklist final confirmando que nenhum card duplica valor de outro com rótulo diferente.
