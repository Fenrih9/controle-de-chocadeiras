alter table public.financeiro_lancamentos
  add column if not exists "formaPagamento" text not null default 'BANCO'
  check ("formaPagamento" in ('BANCO', 'DINHEIRO'));

alter table public.financeiro_lancamentos enable row level security;

drop policy if exists "financeiro_lancamentos_select" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_insert" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_update" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_delete" on public.financeiro_lancamentos;

create policy "financeiro_lancamentos_select"
  on public.financeiro_lancamentos
  for select
  to anon, authenticated
  using (true);

create policy "financeiro_lancamentos_insert"
  on public.financeiro_lancamentos
  for insert
  to anon, authenticated
  with check (true);

create policy "financeiro_lancamentos_update"
  on public.financeiro_lancamentos
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "financeiro_lancamentos_delete"
  on public.financeiro_lancamentos
  for delete
  to anon, authenticated
  using (true);
