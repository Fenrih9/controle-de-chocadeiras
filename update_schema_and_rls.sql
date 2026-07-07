-- 1. Habilitar a extensão UUID se não estiver ativa
create extension if not exists "uuid-ossp";

-- 2. Garantir que a tabela public.usuarios esteja vinculada ao auth.users
-- Adicionar coluna opcional auth_user_id para fazer o vínculo sem quebrar IDs de string legados:
alter table public.usuarios add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

-- 3. Adicionar coluna user_id nas tabelas se não existir
alter table public.propriedades add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chocadeiras add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chocadas add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.registros_diarios add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.ovoscopias add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.registros_nascimentos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.financeiro_lancamentos add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 4. Habilitar RLS em todas as tabelas
alter table public.propriedades enable row level security;
alter table public.chocadeiras enable row level security;
alter table public.chocadas enable row level security;
alter table public.registros_diarios enable row level security;
alter table public.ovoscopias enable row level security;
alter table public.registros_nascimentos enable row level security;
alter table public.financeiro_lancamentos enable row level security;
alter table public.usuarios enable row level security;

-- 5. Criar Políticas RLS — Apenas authenticated, sem anon
--
-- NOTA: Este é um app de gestão compartilhada (não multi-tenant).
-- Todas as tabelas usam 'using (true)' para que todos os usuários
-- autenticados vejam todos os dados. Apenas 'usuarios' mantém
-- isolamento por auth_user_id para proteger perfis individuais.

-- Propriedades
drop policy if exists "propriedades_policy" on public.propriedades;
create policy "propriedades_policy" on public.propriedades
  for all to authenticated using (true) with check (true);

-- Chocadeiras
drop policy if exists "chocadeiras_policy" on public.chocadeiras;
create policy "chocadeiras_policy" on public.chocadeiras
  for all to authenticated using (true) with check (true);

-- Chocadas
drop policy if exists "chocadas_policy" on public.chocadas;
create policy "chocadas_policy" on public.chocadas
  for all to authenticated using (true) with check (true);

-- Registros Diários
drop policy if exists "registros_diarios_policy" on public.registros_diarios;
create policy "registros_diarios_policy" on public.registros_diarios
  for all to authenticated using (true) with check (true);

-- Ovoscopias
drop policy if exists "ovoscopias_policy" on public.ovoscopias;
create policy "ovoscopias_policy" on public.ovoscopias
  for all to authenticated using (true) with check (true);

-- Registros Nascimentos
drop policy if exists "registros_nascimentos_policy" on public.registros_nascimentos;
create policy "registros_nascimentos_policy" on public.registros_nascimentos
  for all to authenticated using (true) with check (true);

-- Financeiro Lançamentos (remove políticas do fix file se existirem)
drop policy if exists "financeiro_lancamentos_policy" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_select" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_insert" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_update" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_delete" on public.financeiro_lancamentos;
create policy "financeiro_lancamentos_policy" on public.financeiro_lancamentos
  for all to authenticated using (true) with check (true);

-- Usuários (cada usuário gerencia apenas seu próprio perfil)
drop policy if exists "usuarios_self_policy" on public.usuarios;
create policy "usuarios_self_policy" on public.usuarios
  for all to authenticated using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
