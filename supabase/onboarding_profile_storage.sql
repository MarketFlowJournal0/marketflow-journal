alter table public.profiles
  add column if not exists onboarding jsonb;

create index if not exists profiles_onboarding_completed_idx
  on public.profiles ((onboarding->>'completedAt'))
  where onboarding is not null;
