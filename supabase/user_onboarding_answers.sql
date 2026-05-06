create table if not exists public.user_onboarding_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  question_label text not null,
  answer jsonb,
  answer_label text,
  answer_labels jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_key)
);

create index if not exists user_onboarding_answers_user_id_idx
  on public.user_onboarding_answers(user_id);

create index if not exists user_onboarding_answers_question_key_idx
  on public.user_onboarding_answers(question_key);

alter table public.user_onboarding_answers enable row level security;

drop policy if exists "Users can read their onboarding answers"
  on public.user_onboarding_answers;
create policy "Users can read their onboarding answers"
  on public.user_onboarding_answers
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their onboarding answers"
  on public.user_onboarding_answers;
create policy "Users can insert their onboarding answers"
  on public.user_onboarding_answers
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their onboarding answers"
  on public.user_onboarding_answers;
create policy "Users can update their onboarding answers"
  on public.user_onboarding_answers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their onboarding answers"
  on public.user_onboarding_answers;
create policy "Users can delete their onboarding answers"
  on public.user_onboarding_answers
  for delete
  using (auth.uid() = user_id);
