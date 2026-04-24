-- ============================================================
-- Migration: Stripe billing + 30-day trial on signup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ensure profiles exists and add billing columns
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  full_name text,
  display_name text,
  avatar_url text,
  anthropic_api_key text,
  bio text,
  timezone text default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles add column if not exists email text;
alter table profiles add column if not exists username text;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists anthropic_api_key text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists timezone text default 'America/New_York';
alter table profiles
  add column if not exists stripe_customer_id   text,
  add column if not exists subscription_status  text not null default 'trialing',
  add column if not exists trial_ends_at        timestamptz,
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists has_seen_pricing     boolean not null default false;

alter table profiles add column if not exists updated_at timestamptz not null default now();
alter table profiles add column if not exists created_at timestamptz not null default now();

-- 2. Index for fast webhook lookups by stripe_customer_id
create index if not exists idx_profiles_stripe_customer_id
  on profiles(stripe_customer_id)
  where stripe_customer_id is not null;

-- 3. Trigger function: initialize profile + start 30-day trial on auth.users INSERT
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, full_name, display_name, avatar_url, subscription_status, trial_ends_at, created_at, updated_at)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'trialing',
    now() + interval '30 days',
    now(),
    now()
  )
  on conflict (id) do update set
    subscription_status = excluded.subscription_status,
    trial_ends_at       = excluded.trial_ends_at,
    display_name        = coalesce(profiles.display_name, excluded.display_name),
    avatar_url          = coalesce(profiles.avatar_url, excluded.avatar_url),
    updated_at          = now()
    where profiles.trial_ends_at is null;
  return new;
end;
$$;

-- 4. Trigger on auth.users INSERT (fires for email + OAuth signups)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Backfill existing users with a fresh 30-day trial window from today
--    (Prevents existing users from being immediately locked when feature ships)
update profiles p
set subscription_status = 'trialing',
    trial_ends_at       = now() + interval '30 days',
    updated_at          = now()
from auth.users u
where p.id = u.id
  and p.trial_ends_at is null;
