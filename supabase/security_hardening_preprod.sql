-- MarketFlow Journal pre-production security hardening.
-- Run this in Supabase SQL Editor after reviewing the table names in your project.
-- Goal: no public/anon data reads, strict owner-scoped RLS, and backend-only Stripe columns.

begin;

-- Helpful audit query to run before/after this migration:
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;
    alter table public.profiles force row level security;

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
    loop
      execute format('drop policy if exists %I on public.profiles', policy_record.policyname);
    end loop;

    create policy "profiles_owner_select"
      on public.profiles
      for select
      to authenticated
      using (auth.uid() = id);

    create policy "profiles_owner_insert"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);

    create policy "profiles_owner_update"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.trades') is not null then
    alter table public.trades enable row level security;
    alter table public.trades force row level security;

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'trades'
    loop
      execute format('drop policy if exists %I on public.trades', policy_record.policyname);
    end loop;

    create policy "trades_owner_select"
      on public.trades
      for select
      to authenticated
      using (auth.uid() = user_id);

    create policy "trades_owner_insert"
      on public.trades
      for insert
      to authenticated
      with check (auth.uid() = user_id);

    create policy "trades_owner_update"
      on public.trades
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    create policy "trades_owner_delete"
      on public.trades
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    revoke all on table public.profiles from anon;
    grant select, insert, update on table public.profiles to authenticated;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'stripe_customer_id'
    ) then
      revoke select (stripe_customer_id)
        on table public.profiles
        from anon, authenticated;
      revoke update (stripe_customer_id)
        on table public.profiles
        from anon, authenticated;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'stripe_subscription_id'
    ) then
      revoke select (stripe_subscription_id)
        on table public.profiles
        from anon, authenticated;
      revoke update (stripe_subscription_id)
        on table public.profiles
        from anon, authenticated;
    end if;
  end if;

  if to_regclass('public.trades') is not null then
    revoke all on table public.trades from anon;
    grant select, insert, update, delete on table public.trades to authenticated;
  end if;
end $$;

-- Keep onboarding answers private to the owning user.
alter table if exists public.user_onboarding_answers enable row level security;
alter table if exists public.user_onboarding_answers force row level security;

-- Keep raw onboarding responses private. Admin exports should go through /api/onboarding
-- with service role and ADMIN_EMAILS verification, not direct client reads.
alter table if exists public.onboarding_responses enable row level security;
alter table if exists public.onboarding_responses force row level security;

-- Leaderboard is readable through the authenticated API route, not public anon PostgREST.
alter table if exists public.leaderboard_daily_snapshots enable row level security;
alter table if exists public.leaderboard_daily_snapshots force row level security;
do $$
declare
  policy_record record;
begin
  if to_regclass('public.leaderboard_daily_snapshots') is not null then
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'leaderboard_daily_snapshots'
    loop
      execute format('drop policy if exists %I on public.leaderboard_daily_snapshots', policy_record.policyname);
    end loop;

    create policy "leaderboard_authenticated_select"
      on public.leaderboard_daily_snapshots
      for select
      to authenticated
      using (auth.role() = 'authenticated');
  end if;
end $$;

commit;

-- Validation examples:
-- 1) With anon key, these should return no rows or a permission error:
--    /rest/v1/profiles?select=*
--    /rest/v1/trades?select=*
-- 2) With user A JWT, filtering another user's id/user_id should return no rows.
-- 3) With user JWT, selecting profiles stripe_customer_id/stripe_subscription_id should fail.
