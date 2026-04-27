create table if not exists leaderboard_daily_snapshots (
  id text primary key,
  user_id uuid not null,
  display_name text,
  day_stamp date not null,
  score int not null,
  position_seed int not null,
  total_trades int not null default 0,
  pnl numeric not null default 0,
  win_rate numeric not null default 0,
  profit_factor numeric not null default 0,
  max_drawdown numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_daily_snapshots_day_score_idx
  on leaderboard_daily_snapshots (day_stamp desc, score desc);

alter table leaderboard_daily_snapshots enable row level security;

create policy "Users can read leaderboard snapshots"
  on leaderboard_daily_snapshots
  for select
  using (true);
