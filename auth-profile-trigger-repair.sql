-- ============================================================
-- Repair: profiles table + new-user auth trigger
-- Run this in Supabase SQL Editor if signup fails with:
-- "Database error saving new user"
-- ============================================================

-- 1. Ensure the profiles table exists with every column the app and
--    billing trigger expect.
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
  stripe_customer_id text,
  subscription_status text not null default 'trialing',
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  has_seen_pricing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists anthropic_api_key text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists timezone text default 'America/New_York';
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists subscription_status text not null default 'trialing';
alter table public.profiles add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists subscription_ends_at timestamptz;
alter table public.profiles add column if not exists has_seen_pricing boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;

-- 2. Ensure RLS allows users to read/update their own profile.
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. Replace the auth trigger with a defensive version.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    full_name,
    display_name,
    avatar_url,
    subscription_status,
    trial_ends_at,
    has_seen_pricing,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'trialing',
    now() + interval '30 days',
    false,
    now(),
    now()
  )
  on conflict (id) do update set
    email = coalesce(public.profiles.email, excluded.email),
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status),
    trial_ends_at = coalesce(public.profiles.trial_ends_at, excluded.trial_ends_at),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill profile rows for any auth users created before this repair.
insert into public.profiles (
  id,
  email,
  username,
  full_name,
  display_name,
  avatar_url,
  subscription_status,
  trial_ends_at,
  has_seen_pricing,
  created_at,
  updated_at
)
select
  u.id,
  u.email,
  split_part(u.email, '@', 1),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  'trialing',
  now() + interval '30 days',
  false,
  now(),
  now()
from auth.users u
on conflict (id) do nothing;
