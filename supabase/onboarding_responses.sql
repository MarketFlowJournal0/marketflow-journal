create extension if not exists pgcrypto;

create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  plan text default 'trial',
  version integer default 1,
  answers jsonb not null default '{}'::jsonb,
  classified jsonb not null default '{}'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  onboarding jsonb not null default '{}'::jsonb,
  source text default 'marketflow_signup_onboarding',
  completed_at timestamptz,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists onboarding_responses_completed_at_idx
  on public.onboarding_responses (completed_at desc);

create index if not exists onboarding_responses_plan_idx
  on public.onboarding_responses (plan);

alter table public.onboarding_responses enable row level security;

drop policy if exists "Users can read their onboarding response" on public.onboarding_responses;
create policy "Users can read their onboarding response"
  on public.onboarding_responses
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their onboarding response" on public.onboarding_responses;
create policy "Users can insert their onboarding response"
  on public.onboarding_responses
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their onboarding response" on public.onboarding_responses;
create policy "Users can update their onboarding response"
  on public.onboarding_responses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
