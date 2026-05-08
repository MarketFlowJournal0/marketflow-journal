create extension if not exists pgcrypto;

create table if not exists public.broker_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  broker_type text not null default 'webhook',
  account_number text,
  account_name text,
  server_name text,
  api_token text unique,
  status text not null default 'waiting',
  connection_status text,
  is_active boolean not null default true,
  last_sync_at timestamptz,
  total_trades_synced integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.broker_accounts add column if not exists broker_type text not null default 'webhook';
alter table public.broker_accounts add column if not exists account_number text;
alter table public.broker_accounts add column if not exists account_name text;
alter table public.broker_accounts add column if not exists server_name text;
alter table public.broker_accounts add column if not exists api_token text;
alter table public.broker_accounts add column if not exists status text not null default 'waiting';
alter table public.broker_accounts add column if not exists connection_status text;
alter table public.broker_accounts add column if not exists is_active boolean not null default true;
alter table public.broker_accounts add column if not exists last_sync_at timestamptz;
alter table public.broker_accounts add column if not exists total_trades_synced integer not null default 0;
alter table public.broker_accounts add column if not exists created_at timestamptz not null default now();
alter table public.broker_accounts add column if not exists updated_at timestamptz not null default now();

create unique index if not exists broker_accounts_api_token_idx
  on public.broker_accounts(api_token)
  where api_token is not null and api_token <> '';

create index if not exists broker_accounts_user_id_idx
  on public.broker_accounts(user_id);

create index if not exists broker_accounts_status_idx
  on public.broker_accounts(status);

alter table public.broker_accounts enable row level security;

drop policy if exists "Users can read their broker accounts" on public.broker_accounts;
create policy "Users can read their broker accounts"
  on public.broker_accounts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their broker accounts" on public.broker_accounts;
create policy "Users can create their broker accounts"
  on public.broker_accounts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their broker accounts" on public.broker_accounts;
create policy "Users can update their broker accounts"
  on public.broker_accounts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their broker accounts" on public.broker_accounts;
create policy "Users can delete their broker accounts"
  on public.broker_accounts
  for delete
  using (auth.uid() = user_id);
