-- ============================================
-- Supabase Migration: Trading App Tables
-- Run this in your Supabase SQL Editor
-- ============================================

-- Trades table
create table if not exists trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  dt timestamptz,
  asset text,
  direction text,
  aplus text,
  taken text,
  bias text,
  profit numeric,
  chart text,
  after_chart text,
  notes text,
  created_at timestamptz default now()
);

alter table trades enable row level security;

create policy "Users can view own trades"
  on trades for select using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on trades for insert with check (auth.uid() = user_id);

create policy "Users can update own trades"
  on trades for update using (auth.uid() = user_id);

create policy "Users can delete own trades"
  on trades for delete using (auth.uid() = user_id);

-- Trade Plans table
create table if not exists trade_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_date date not null,
  bias text,
  max_trades integer default 2,
  key_levels text,
  session_plan text,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, plan_date)
);

alter table trade_plans enable row level security;

create policy "Users can view own plans"
  on trade_plans for select using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on trade_plans for insert with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on trade_plans for update using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on trade_plans for delete using (auth.uid() = user_id);

-- Accounts table (funded accounts, evals, personal)
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  firm text not null,
  account_name text not null,
  account_type text not null default 'eval',
  account_size numeric,
  profit_target numeric,
  current_pnl numeric,
  max_drawdown numeric,
  daily_loss_limit numeric,
  status text not null default 'active',
  start_date date,
  notes text,
  created_at timestamptz default now()
);

alter table accounts enable row level security;

create policy "Users can view own accounts"
  on accounts for select using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on accounts for insert with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on accounts for update using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on accounts for delete using (auth.uid() = user_id);

-- Daily Moods table
create table if not exists daily_moods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mood_date date not null,
  mood text not null,
  created_at timestamptz default now(),
  unique(user_id, mood_date)
);

alter table daily_moods enable row level security;

create policy "Users can view own moods"
  on daily_moods for select using (auth.uid() = user_id);

create policy "Users can insert own moods"
  on daily_moods for insert with check (auth.uid() = user_id);

create policy "Users can update own moods"
  on daily_moods for update using (auth.uid() = user_id);

create policy "Users can delete own moods"
  on daily_moods for delete using (auth.uid() = user_id);

-- Add after_thoughts column to trades (run if upgrading existing DB)
alter table trades add column if not exists after_thoughts text;

-- Indexes
create index if not exists idx_trades_user_dt on trades(user_id, dt);
create index if not exists idx_trade_plans_user_date on trade_plans(user_id, plan_date);
create index if not exists idx_accounts_user on accounts(user_id);
create index if not exists idx_daily_moods_user_date on daily_moods(user_id, mood_date);
