-- ============================================================
-- MIGRAÇÃO: Tabela notificacoes para sino de notificações
-- Execute no: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Criar tabela notificacoes
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  severidade text not null check (severidade in ('CRITICO', 'ATENCAO', 'INFORMATIVO')),
  tipo_alerta text not null,
  titulo text not null,
  descricao text not null default '',
  entidade_relacionada text,
  link_destino text,
  chocada_id text,
  chocadeira_id text,
  timestamp_completo timestamptz not null default now(),
  lido boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- 2. Índices para performance
create index if not exists idx_notificacoes_user_id on public.notificacoes(user_id);
create index if not exists idx_notificacoes_user_lido on public.notificacoes(user_id, lido);
create index if not exists idx_notificacoes_timestamp on public.notificacoes(timestamp_completo desc);

-- 3. Habilitar RLS
alter table public.notificacoes enable row level security;

-- 4. Políticas RLS — cada usuário vê apenas suas próprias notificações
drop policy if exists "notificacoes_select" on public.notificacoes;
create policy "notificacoes_select" on public.notificacoes
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notificacoes_insert" on public.notificacoes;
create policy "notificacoes_insert" on public.notificacoes
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notificacoes_update" on public.notificacoes;
create policy "notificacoes_update" on public.notificacoes
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notificacoes_delete" on public.notificacoes;
create policy "notificacoes_delete" on public.notificacoes
  for delete to authenticated
  using (auth.uid() = user_id);

-- 5. Função para atualizar updated_at automaticamente
create or replace function public.handle_notificacao_updated_at()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notificacoes_updated_at on public.notificacoes;
create trigger trg_notificacoes_updated_at
  before update on public.notificacoes
  for each row
  execute function public.handle_notificacao_updated_at();
