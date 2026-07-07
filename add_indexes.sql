-- ============================================================
-- INDEXES: Otimização de queries para Controle de Chocadeiras
-- Execute no: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Baseado na análise de repository.ts, estas colunas são
-- as mais filtradas/joinadas nas queries do Supabase.
--
-- NOTA: Colunas usam camelCase no banco (chocadeiraId, chocadaId)
-- conforme definido nas interfaces TypeScript do projeto.
-- ============================================================

-- ============================================================
-- CHOCADEIRAS
-- ============================================================
-- query: .eq('excluido', false) — usada em loadFromSupabase
CREATE INDEX IF NOT EXISTS idx_chocadeiras_excluido
  ON public.chocadeiras (excluido)
  WHERE excluido = false;

-- ============================================================
-- CHOCADAS (incubações) — tabela com mais queries complexas
-- ============================================================
-- query: .eq('chocadeiraId', ...).eq('excluido', false) — getChocadeiraOcupadaPor
CREATE INDEX IF NOT EXISTS idx_chocadas_chocadeira_excluido
  ON public.chocadas ("chocadeiraId", excluido)
  WHERE excluido = false;

-- query: .eq('excluido', false) — loadFromSupabase
CREATE INDEX IF NOT EXISTS idx_chocadas_excluido
  ON public.chocadas (excluido)
  WHERE excluido = false;

-- query: filtro por status (EM_ANDAMENTO, PROXIMA, etc.) — getAlertas
CREATE INDEX IF NOT EXISTS idx_chocadas_status
  ON public.chocadas (status)
  WHERE excluido = false;

-- query: .eq('finalizada', true).eq('excluido', false) — getEstoquePintinhosPorChocadeira
CREATE INDEX IF NOT EXISTS idx_chocadas_finalizada
  ON public.chocadas ("chocadeiraId", finalizada)
  WHERE excluido = false;

-- ============================================================
-- REGISTROS DIÁRIOS
-- ============================================================
-- query: .eq('chocadaId', ...).eq('excluido', false) — getRegistrosDiarios
CREATE INDEX IF NOT EXISTS idx_registros_diarios_chocada_excluido
  ON public.registros_diarios ("chocadaId", excluido)
  WHERE excluido = false;

-- query: .eq('excluido', false).gte('data', limitDateStr) — loadFromSupabase
CREATE INDEX IF NOT EXISTS idx_registros_diarios_data
  ON public.registros_diarios (data DESC)
  WHERE excluido = false;

-- ============================================================
-- OVOSCOPIAS
-- ============================================================
-- query: .eq('chocadaId', ...).eq('excluido', false) — getOvoscopias
CREATE INDEX IF NOT EXISTS idx_ovoscopias_chocada_excluido
  ON public.ovoscopias ("chocadaId", excluido)
  WHERE excluido = false;

-- ============================================================
-- REGISTROS NASCIMENTO
-- ============================================================
-- query: .eq('chocadaId', ...).eq('excluido', false) — getRegistrosNascimento
CREATE INDEX IF NOT EXISTS idx_registros_nasc_chocada_excluido
  ON public.registros_nascimentos ("chocadaId", excluido)
  WHERE excluido = false;

-- ============================================================
-- FINANCEIRO LANÇAMENTOS — tabela com mais filtros cruzados
-- ============================================================
-- query: .eq('excluido', false) — loadFromSupabase, getLancamentos
CREATE INDEX IF NOT EXISTS idx_financeiro_excluido
  ON public.financeiro_lancamentos (excluido)
  WHERE excluido = false;

-- query: filtro por chocadeira + tipo + categoria — getEstoquePintinhosPorChocadeira
--   l => !l.excluido && l.tipo === 'RECEITA' && l.categoria === 'Venda de Pintinhos' && l.chocadeiraId === ...
CREATE INDEX IF NOT EXISTS idx_financeiro_estoque_venda
  ON public.financeiro_lancamentos ("chocadeiraId")
  WHERE excluido = false AND tipo = 'RECEITA' AND categoria = 'Venda de Pintinhos';

-- query: ordenação por data desc — getLancamentos
CREATE INDEX IF NOT EXISTS idx_financeiro_data
  ON public.financeiro_lancamentos (data DESC)
  WHERE excluido = false;

-- ============================================================
-- USUÁRIOS
-- ============================================================
-- query: .eq('ativo', true) — loadFromSupabase
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo
  ON public.usuarios (ativo)
  WHERE ativo = true;

-- query: .eq('auth_user_id', ...) — fetchUserProfile
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id
  ON public.usuarios (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ============================================================
-- PROPRIEDADES (menor prioridade, tabela pequena)
-- ============================================================
-- query: select('*') sem filtro — loadFromSupabase
-- Não precisa de índice adicional (tabela com 1 registro)
