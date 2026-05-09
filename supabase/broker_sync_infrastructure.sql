create extension if not exists pgcrypto;

alter table public.broker_accounts add column if not exists sync_status text not null default 'waiting_for_payload';
alter table public.broker_accounts add column if not exists connection_method text;
alter table public.broker_accounts add column if not exists provider text;
alter table public.broker_accounts add column if not exists last_heartbeat_at timestamptz;
alter table public.broker_accounts add column if not exists last_payload_at timestamptz;
alter table public.broker_accounts add column if not exists last_error text;
alter table public.broker_accounts add column if not exists sync_attempts integer not null default 0;
alter table public.broker_accounts add column if not exists failed_sync_attempts integer not null default 0;
alter table public.broker_accounts add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists broker_accounts_sync_status_idx
  on public.broker_accounts(sync_status);

create index if not exists broker_accounts_last_heartbeat_idx
  on public.broker_accounts(last_heartbeat_at desc);

create table if not exists public.broker_sync_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.broker_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  status text not null,
  message text,
  payload_hash text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists broker_sync_logs_account_created_idx
  on public.broker_sync_logs(account_id, created_at desc);

create index if not exists broker_sync_logs_user_created_idx
  on public.broker_sync_logs(user_id, created_at desc);

create table if not exists public.broker_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.broker_accounts(id) on delete set null,
  source text not null default 'manual_import',
  format text not null default 'generic',
  status text not null default 'pending',
  file_name text,
  row_count integer not null default 0,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  rejected_count integer not null default 0,
  mapping jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists broker_import_batches_user_created_idx
  on public.broker_import_batches(user_id, created_at desc);

alter table public.broker_sync_logs enable row level security;
alter table public.broker_import_batches enable row level security;

drop policy if exists "Users can read broker sync logs" on public.broker_sync_logs;
create policy "Users can read broker sync logs"
  on public.broker_sync_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read broker import batches" on public.broker_import_batches;
create policy "Users can read broker import batches"
  on public.broker_import_batches
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create broker import batches" on public.broker_import_batches;
create policy "Users can create broker import batches"
  on public.broker_import_batches
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update broker import batches" on public.broker_import_batches;
create policy "Users can update broker import batches"
  on public.broker_import_batches
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
