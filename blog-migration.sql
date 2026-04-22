-- ============================================================
-- Blog Posts Table
-- Run in Supabase SQL Editor to enable Supabase-backed blog
-- After running: set USE_SUPABASE = true in src/lib/blog.js
-- ============================================================

create table if not exists blog_posts (
  id               uuid default gen_random_uuid() primary key,
  slug             text not null unique,
  title            text not null,
  subtitle         text,
  excerpt          text not null,
  content          text not null default '',
  meta_description text,
  og_image_url     text,
  tags             text[] not null default '{}',
  category         text,
  accent           text default '#22d3ee',
  author_name      text not null default 'TradeSharp Team',
  author_avatar_url text,
  reading_time     integer not null default 5,
  featured         boolean not null default false,
  status           text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_blog_posts_slug     on blog_posts(slug);
create index if not exists idx_blog_posts_status   on blog_posts(status);
create index if not exists idx_blog_posts_tags     on blog_posts using gin(tags);
create index if not exists idx_blog_posts_pub_date on blog_posts(published_at desc) where status = 'published';

alter table blog_posts enable row level security;

create policy "Public read published blog posts"
  on blog_posts for select
  using (status = 'published' and published_at <= now());

create policy "Authenticated users can manage blog posts"
  on blog_posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create or replace function update_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger blog_posts_updated_at_trigger
  before update on blog_posts
  for each row execute function update_blog_posts_updated_at();
