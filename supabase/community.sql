-- ============================================================
-- Protidhwani — Community feed schema (posts, supports, comments, flags)
-- Run AFTER supabase/schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type public.post_kind as enum
    ('report','emergency','verified','discussion','rights','missing','poll','event');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('pending','verified','disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_level as enum ('critical','high','moderate');
exception when duplicate_object then null; end $$;

-- ---------- posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.post_kind not null default 'discussion',
  title text not null check (char_length(title) between 3 and 200),
  title_en text,
  body text not null check (char_length(body) between 5 and 5000),
  body_en text,
  location text,
  district text,
  tags text[] not null default '{}',
  image_urls text[] not null default '{}',
  level public.post_level,
  status public.post_status not null default 'pending',
  support_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_kind_idx on public.posts (kind);
create index if not exists posts_user_idx on public.posts (user_id);

grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant all on public.posts to service_role;
alter table public.posts enable row level security;

drop policy if exists "posts readable by everyone" on public.posts;
create policy "posts readable by everyone" on public.posts for select using (true);
drop policy if exists "users create own posts" on public.posts;
create policy "users create own posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users update own posts" on public.posts;
create policy "users update own posts" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own posts" on public.posts;
create policy "users delete own posts" on public.posts for delete to authenticated using (auth.uid() = user_id);

-- ---------- post_supports ----------
create table if not exists public.post_supports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
grant select, insert, delete on public.post_supports to authenticated;
grant select on public.post_supports to anon;
grant all on public.post_supports to service_role;
alter table public.post_supports enable row level security;

drop policy if exists "supports readable by everyone" on public.post_supports;
create policy "supports readable by everyone" on public.post_supports for select using (true);
drop policy if exists "users add own support" on public.post_supports;
create policy "users add own support" on public.post_supports for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users remove own support" on public.post_supports;
create policy "users remove own support" on public.post_supports for delete to authenticated using (auth.uid() = user_id);

create or replace function public.sync_post_support_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set support_count = support_count + 1 where id = new.post_id;
  else
    update public.posts set support_count = greatest(support_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists post_supports_sync on public.post_supports;
create trigger post_supports_sync
after insert or delete on public.post_supports
for each row execute function public.sync_post_support_count();

-- ---------- post_comments ----------
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
grant select, insert, update, delete on public.post_comments to authenticated;
grant select on public.post_comments to anon;
grant all on public.post_comments to service_role;
alter table public.post_comments enable row level security;

drop policy if exists "post comments readable by everyone" on public.post_comments;
create policy "post comments readable by everyone" on public.post_comments for select using (true);
drop policy if exists "users write own post comments" on public.post_comments;
create policy "users write own post comments" on public.post_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users delete own post comments" on public.post_comments;
create policy "users delete own post comments" on public.post_comments for delete to authenticated using (auth.uid() = user_id);

create or replace function public.sync_post_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  else
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists post_comments_sync on public.post_comments;
create trigger post_comments_sync
after insert or delete on public.post_comments
for each row execute function public.sync_post_comment_count();

-- ---------- post_flags (report / dispute a post) ----------
create table if not exists public.post_flags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
grant select, insert, delete on public.post_flags to authenticated;
grant all on public.post_flags to service_role;
alter table public.post_flags enable row level security;

drop policy if exists "users read own flags" on public.post_flags;
create policy "users read own flags" on public.post_flags for select to authenticated using (auth.uid() = user_id);
drop policy if exists "users create own flags" on public.post_flags;
create policy "users create own flags" on public.post_flags for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users remove own flags" on public.post_flags;
create policy "users remove own flags" on public.post_flags for delete to authenticated using (auth.uid() = user_id);

-- ---------- storage bucket for community images ----------
insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;

drop policy if exists "community images are public" on storage.objects;
create policy "community images are public" on storage.objects
  for select using (bucket_id = 'community-images');

drop policy if exists "users upload own community images" on storage.objects;
create policy "users upload own community images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own community images" on storage.objects;
create policy "users delete own community images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.post_comments;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.post_supports;
exception when duplicate_object then null; end $$;

-- ============================================================
-- Storage bucket for community photos AND videos.
-- Run this if uploads fail with "Bucket not found" or a MIME error.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-images', 'community-images', true, 52428800,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/heic',
    'video/mp4','video/webm','video/quicktime','video/x-m4v','video/ogg'
  ]
)
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read; owners write their own `<uid>/...` prefix.
drop policy if exists "community media public read" on storage.objects;
create policy "community media public read" on storage.objects
  for select using (bucket_id = 'community-images');

drop policy if exists "community media owner write" on storage.objects;
create policy "community media owner write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "community media owner delete" on storage.objects;
create policy "community media owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);
