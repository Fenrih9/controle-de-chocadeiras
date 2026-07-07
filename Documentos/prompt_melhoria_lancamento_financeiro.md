# PROMPT DE EXECUÇÃO — Melhoria do Modal "Novo Lançamento" (Página Financeiro)

> Copie este documento inteiro e cole no DeepSeek V4 Flash. Preencha a seção **0. Contexto Técnico** antes de enviar.

---

## 0. Contexto Técnico (PREENCHER ANTES DE ENVIAR)

```
Stack frontend: [ex: React + Vite / Next.js / outro]
Framework de estilo: [Tailwind, CSS puro, outro]
Backend/fonte de dados: [ex: Supabase, API própria]
Arquivo(s) do componente atual do modal "Novo Lançamento": [caminho(s)]
Como o campo "Quantidade Vendida" e "Disponível p/ Venda" são obtidos hoje: [query/hook atual, se souber]
```

---

## 1. Papel e Objetivo

Você é um engenheiro frontend sênior especializado em formulários financeiros e UX de dados. Sua tarefa é reformular o modal **"Novo Lançamento"** da página Financeiro de um sistema de controle de eclosão de chocadeiras, resolvendo dois problemas específicos de usabilidade, sem alterar o restante do fluxo (tipo de lançamento, forma de pagamento, categorias, etc.).

Não adicione campos ou funcionalidades fora do escopo abaixo. Não altere outras telas.

---

## 2. Diagnóstico do Problema Atual

1. **Ambiguidade no campo "Valor Total da Venda".** Quando a categoria envolve venda por unidade (ex: "Venda de Pintinhos") com controle de estoque e quantidade vendida, não fica claro se o usuário deve informar o valor **total da negociação** ou o valor **unitário por item**. Exemplo real: vendeu 15 pintinhos a R$ 8,00 cada — o usuário não sabe se deve digitar 120,00 (total) ou 8,00 (unitário), e o sistema não indica qual interpretação está sendo usada.
2. **Ausência de prévia/cálculo em tempo real.** O usuário preenche todos os campos "às cegas" e só descobre se o valor faz sentido depois de registrar. Não há feedback visual imediato de quanto será lançado, nem do impacto no estoque disponível.

---

## 3. Solução Especificada

### 3.1 Toggle de modo de valor (resolve o problema 1)

Quando a categoria selecionada tiver controle de estoque ativo (ex: possui campo "Quantidade Vendida"), exibir um seletor de modo logo acima do campo de valor:

```
Informar valor por: ( Valor Total da Venda )  ( Valor Unitário )
```

Comportamento:
- **Modo "Valor Total da Venda"** (padrão atual): usuário digita o valor total já negociado. O sistema calcula e exibe o valor unitário automaticamente (somente leitura) assim que "Quantidade Vendida" > 0.
- **Modo "Valor Unitário"**: usuário digita o preço por pintinho/unidade. O sistema calcula e exibe o valor total automaticamente (somente leitura) assim que "Quantidade Vendida" > 0.
- O rótulo do campo principal deve mudar dinamicamente conforme o modo selecionado (ex: "Valor Total da Venda (R$)" vs. "Valor Unitário por Pintinho (R$)").
- O valor efetivamente salvo no banco continua sendo sempre o **valor total** (para manter consistência com relatórios financeiros existentes) — o modo unitário é apenas uma forma alternativa de entrada, convertida internamente:

```js
// Lógica de conversão — pseudocódigo
function calcularValores({ modo, valorDigitado, quantidade }) {
  if (!quantidade || quantidade <= 0) {
    return { valorTotal: modo === 'total' ? valorDigitado : null, valorUnitario: modo === 'unitario' ? valorDigitado : null };
  }

  if (modo === 'total') {
    return {
      valorTotal: valorDigitado,
      valorUnitario: valorDigitado / quantidade,
    };
  }

  if (modo === 'unitario') {
    return {
      valorTotal: valorDigitado * quantidade,
      valorUnitario: valorDigitado,
    };
  }
}
```

- Se a categoria **não** tiver controle de estoque (ex: despesas gerais, receitas avulsas), ocultar o toggle e manter o campo único "Valor" como está hoje.

### 3.2 Card de Prévia de Lançamento em tempo real (resolve o problema 2)

Adicionar um bloco fixo de resumo, visível continuamente enquanto o usuário preenche o formulário (pode ficar logo acima do campo Descrição, ou fixado no rodapé do modal). Deve atualizar a cada alteração de campo, sem necessidade de clique.

**Conteúdo do card (adaptar conforme os campos preenchidos):**

```
RESUMO DO LANÇAMENTO
Tipo:              Receita (Crédito)
Categoria:         Venda de Pintinhos
Quantidade:        15 unidades
Valor unitário:    R$ 8,00
Valor total:       R$ 120,00
────────────────────────────
Estoque antes:     90 disponíveis
Estoque depois:    75 disponíveis
```

Regras:
- Campos que ainda não foram preenchidos aparecem com placeholder neutro (ex: "—") em vez de zero, para não parecer erro.
- Se a Quantidade Vendida informada for **maior que o Disponível p/ Venda**, o card deve exibir um alerta visual (cor de atenção, ex: vermelho/laranja) na linha "Estoque depois", com mensagem curta: "Quantidade excede o estoque disponível".
- Se a categoria não envolver controle de estoque, omitir as linhas de estoque e mostrar apenas Tipo, Categoria e Valor.
- O card deve ser puramente derivado do estado do formulário (nenhuma chamada extra ao backend) para garantir atualização instantânea.

---

## 4. Requisitos de Implementação

- Toda a lógica de cálculo (seção 3.1) deve ficar isolada em uma função pura/hook (`useLancamentoCalculado` ou equivalente), testável independentemente da UI.
- Validação no submit: bloquear o registro (ou exigir confirmação explícita) se a quantidade vendida exceder o estoque disponível — hoje isso não é impedido.
- Manter toda a estrutura visual e componentes já existentes do modal (cores, cards de estoque, botões Cancelar/Registrar) — a mudança é aditiva, não uma reescrita visual completa.
- Formatação de moeda em R$ com 2 casas decimais, tratando corretamente entrada de vírgula/ponto conforme padrão já usado no projeto.
- Acessibilidade: o toggle de modo de valor deve ser navegável por teclado e ter `aria-pressed`/equivalente indicando o modo ativo.

---

## 5. Entregáveis Esperados

1. Proposta de estrutura de estado do formulário (quais campos novos, ex: `modoValor`, `valorUnitario`, `valorTotal`).
2. Código do toggle de modo de valor.
3. Código do card de Prévia de Lançamento, reativo ao estado do formulário.
4. Código da função/hook de cálculo isolada (conforme pseudocódigo da seção 3.1).
5. Checklist final confirmando: (a) valor salvo no banco é sempre o total; (b) prévia atualiza sem delay perceptível; (c) alerta de estoque insuficiente funciona; (d) categorias sem estoque não quebram o formulário.
