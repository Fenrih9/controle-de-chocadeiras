# PROMPT DE EXECUÇÃO — Migração do Feed de Alertas para Sino de Notificações + Reorganização

> Copie este documento inteiro e cole no DeepSeek V4 Flash. Preencha a seção **0. Contexto Técnico** antes de enviar.

---

## 0. Contexto Técnico (PREENCHER ANTES DE ENVIAR)

```
Stack frontend: [ex: React + Vite / Next.js / outro]
Framework de estilo: [Tailwind, CSS puro, outro]
Backend/fonte de dados: [ex: Supabase, API própria]
Existe suporte a realtime/websocket no backend (ex: Supabase Realtime)? [sim/não]
Arquivo(s) atuais: componente de sidebar, componente "Feed de Alertas", componente de topbar/header (se existir)
Como os alertas são gerados hoje: [tabela no banco / cálculo no frontend / outro]
```

---

## 1. Papel e Objetivo

Você é um engenheiro frontend sênior especializado em sistemas de notificação. Sua tarefa é **remover a página "Feed de Alertas" da navegação lateral (sidebar)** e substituí-la por um **ícone de sino no topo da aplicação**, com painel dropdown de notificações, além de **corrigir a taxonomia dos alertas**, que hoje mistura itens críticos com itens informativos sob o mesmo rótulo.

Não altere outras páginas ou o fluxo de autenticação. Escopo: navegação, componente de notificações, e a lógica de classificação de alertas.

---

## 2. Diagnóstico do Problema Atual

1. **Item de menu ocupando espaço permanente para conteúdo transitório.** "Feed de Alertas" está fixo na sidebar, mas é essencialmente uma lista de notificações — não é uma seção de navegação estrutural do sistema.
2. **Rótulo incorreto/enganoso.** A página se chama "Histórico Alertas Críticos", mas contém itens que não são críticos nem exigem ação (ex: "Novo Lote Cadastrado", "Pintinhos Nascidos" — são sucessos/informativos, não alertas).
3. **Sem hierarquia de urgência.** Todos os cards têm o mesmo tamanho e peso visual, misturando "registro pendente hoje" (urgente) com "novo lote cadastrado" (informativo) sem diferenciação clara de prioridade.
4. **Sem timestamp.** Impossível saber se um alerta é de agora ou de 3 dias atrás.
5. **Sem estado lido/não lido.** Usuário não tem como saber o que já viu.
6. **Sem ação de clique.** Nenhum card leva à tela relacionada (ex: clicar em "Pendente: Registro diário em Chocadeira 3" deveria abrir o registro daquele ciclo).

---

## 3. Nova Arquitetura

### 3.1 Remoção da sidebar
- Remover o item "Feed de Alertas" do menu lateral ("PAINEL GERAL").
- Não remover a lógica de geração de alertas — apenas o ponto de entrada visual.

### 3.2 Ícone de sino no topo
- Adicionar um ícone de sino no cabeçalho superior (mesma área onde hoje fica o avatar "admin"/tema, ou ao lado dele).
- Badge numérico sobre o sino mostrando a **contagem de alertas não lidos que exigem ação** (níveis Crítico + Atenção — ver seção 3.3). Alertas Informativos não devem inflar esse contador.
- Se houver pelo menos 1 alerta **Crítico** não lido, o badge deve usar cor vermelha; se houver apenas alertas de Atenção, cor laranja/amarela; sem pendências, sem badge.

### 3.3 Painel dropdown ao clicar no sino
- Abre um painel flutuante (não navega para nova página), ancorado abaixo do sino.
- Estrutura do painel:
  - Cabeçalho: "Notificações" + botão "Marcar todas como lidas".
  - Abas ou filtro simples: **Todos** / **Não lidos**.
  - Lista agrupada por severidade, nesta ordem: 🔴 Crítico → 🟠 Atenção → 🔵 Informativo.
  - Cada item exibe: ícone de severidade, título, descrição curta (1-2 linhas), tempo relativo (ex: "há 2h", "ontem"), e indicador visual de não lido (ponto/destaque de fundo).
  - Cada item é clicável e navega para a tela relacionada ao alerta (ver mapeamento na seção 4), marcando-o como lido automaticamente ao clicar.
  - Rodapé do painel: link "Ver histórico completo" — opcional, pode abrir uma página dedicada de histórico (fora da sidebar principal, acessível só por esse link) se o volume de alertas justificar.
- Painel deve fechar ao clicar fora dele (overlay/click-outside).
- Painel deve ter altura máxima com scroll interno (evitar lista infinita expandindo a tela toda).

---

## 4. Taxonomia de Severidade e Mapeamento de Ação

Reclassifique os tipos de alerta existentes e adicione os sugeridos abaixo. Cada alerta deve ter: `severidade`, `tipo`, `titulo`, `descricao`, `entidade_relacionada` (chocadeira/ciclo/lote), `link_destino`, `timestamp`, `lido` (boolean).

| Severidade | Tipo de Alerta | Exemplo de Gatilho | Ação ao clicar |
|---|---|---|---|
| 🔴 Crítico | Registro atrasado | Chocadeira sem registro diário há mais de 48h (não apenas "hoje") | Abrir tela de registro da chocadeira |
| 🔴 Crítico | Parâmetro fora da faixa | Temperatura/umidade fora do ideal, se houver sensor integrado | Abrir detalhe da chocadeira |
| 🔴 Crítico | Eclosão abaixo do esperado | Ciclo finalizado com taxa de eclosão muito abaixo da média histórica da chocadeira | Abrir relatório do ciclo |
| 🟠 Atenção | Registro pendente hoje | Inspeção diária ainda não feita no dia corrente | Abrir tela de registro da chocadeira |
| 🟠 Atenção | Nascimento próximo | Faltam ≤3 dias para o nascimento previsto | Abrir detalhe do ciclo/chocadeira |
| 🔵 Informativo | Novo lote cadastrado | Novo ciclo de incubação iniciado | Abrir detalhe do lote |
| 🔵 Informativo | Pintinhos nascidos | Nascimento registrado com sucesso | Abrir relatório do ciclo |

Regra: **alertas Informativos nunca contam no badge numérico do sino** — eles existem apenas como registro de atividade, não como pendência.

(Se o sistema já tiver outros tipos de alerta não listados aqui, mantenha-os e classifique-os em um dos 3 níveis seguindo a mesma lógica: exige ação imediata = Crítico; exige ação em breve = Atenção; apenas informa = Informativo.)

---

## 5. Requisitos de Implementação

- Componente do sino deve ser isolado (`NotificationBell` ou equivalente) e incluído no layout global do header, visível em todas as páginas autenticadas.
- Estado de leitura (`lido`) deve ser persistido no backend por usuário — não usar apenas estado local de frontend, para não perder o histórico ao recarregar a página.
- Se o backend suportar realtime, o badge deve atualizar automaticamente sem precisar recarregar a página; caso contrário, usar polling em intervalo razoável (ex: a cada 60s).
- Ordenação padrão da lista: mais recente primeiro dentro de cada grupo de severidade.
- Componente deve ser acessível: navegável por teclado, `aria-label` no sino indicando quantidade de não lidos.

---

## 6. Entregáveis Esperados

1. Proposta de schema/estrutura de dados do alerta (campos da seção 4), caso ainda não exista.
2. Componente `NotificationBell` com badge e painel dropdown.
3. Lógica de marcação de lido/não lido (individual e "marcar todas").
4. Migração/remoção do item de sidebar, sem quebrar rotas existentes (decidir se a rota antiga redireciona ou é removida).
5. Checklist final confirmando: (a) badge não conta Informativos; (b) clique em cada tipo de alerta navega corretamente; (c) estado de leitura persiste após reload; (d) painel fecha ao clicar fora.
