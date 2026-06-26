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

-- 5. Criar Políticas RLS baseadas em auth.uid()
-- Propriedades
drop policy if exists "propriedades_policy" on public.propriedades;
create policy "propriedades_policy" on public.propriedades
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chocadeiras
drop policy if exists "chocadeiras_policy" on public.chocadeiras;
create policy "chocadeiras_policy" on public.chocadeiras
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chocadas
drop policy if exists "chocadas_policy" on public.chocadas;
create policy "chocadas_policy" on public.chocadas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Registros Diários
drop policy if exists "registros_diarios_policy" on public.registros_diarios;
create policy "registros_diarios_policy" on public.registros_diarios
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ovoscopias
drop policy if exists "ovoscopias_policy" on public.ovoscopias;
create policy "ovoscopias_policy" on public.ovoscopias
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Registros Nascimentos
drop policy if exists "registros_nascimentos_policy" on public.registros_nascimentos;
create policy "registros_nascimentos_policy" on public.registros_nascimentos
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Financeiro Lançamentos
drop policy if exists "financeiro_lancamentos_policy" on public.financeiro_lancamentos;
create policy "financeiro_lancamentos_policy" on public.financeiro_lancamentos
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Usuários (permitir que o próprio usuário veja e gerencie seu registro, ou admins vejam todos)
drop policy if exists "usuarios_self_policy" on public.usuarios;
create policy "usuarios_self_policy" on public.usuarios
  for all to authenticated using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
