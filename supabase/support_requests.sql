create extension if not exists pgcrypto;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  category text not null default 'general',
  subject text not null default 'MarketFlow support request',
  message text not null,
  plan text not null default 'public',
  priority text not null default 'normal',
  status text not null default 'open' check (status in ('open', 'queued', 'sent', 'failed', 'closed')),
  email_status text,
  email_error text,
  resend_id text,
  source text not null default 'journal_support',
  user_agent text,
  ip_address text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists support_requests_user_id_idx on public.support_requests(user_id);
create index if not exists support_requests_created_at_idx on public.support_requests(created_at desc);
create index if not exists support_requests_status_idx on public.support_requests(status);

alter table public.support_requests enable row level security;
alter table public.support_requests force row level security;

revoke all on public.support_requests from anon;
revoke all on public.support_requests from authenticated;

grant select, insert on public.support_requests to authenticated;

drop policy if exists "Users can read their own support requests" on public.support_requests;
create policy "Users can read their own support requests"
  on public.support_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own support requests" on public.support_requests;
create policy "Users can insert their own support requests"
  on public.support_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);
