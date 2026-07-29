-- ============================================================
-- Protidhwani (প্রতিধ্বনি) — Supabase schema, grants, RLS, storage
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enum ----------
do $$ begin
  create type public.complaint_status as enum ('open','in_progress','resolved','rejected');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  full_name_bn text,
  username text unique,
  phone text,
  district text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone" on public.profiles for select using (true);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "users delete own profile" on public.profiles;
create policy "users delete own profile" on public.profiles for delete to authenticated using (auth.uid() = id);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_bn text not null,
  name_en text not null,
  icon text,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
drop policy if exists "categories readable by everyone" on public.categories;
create policy "categories readable by everyone" on public.categories for select using (true);

insert into public.categories (slug, name_bn, name_en, icon) values
  ('road',        'রাস্তা ও অবকাঠামো', 'Roads & Infrastructure', 'road'),
  ('waste',       'বর্জ্য ব্যবস্থাপনা', 'Waste Management',       'trash'),
  ('water',       'পানি ও পয়ঃনিষ্কাশন', 'Water & Sanitation',     'droplet'),
  ('electricity', 'বিদ্যুৎ',            'Electricity',            'zap'),
  ('safety',      'নিরাপত্তা',          'Public Safety',          'shield'),
  ('corruption',  'দুর্নীতি',           'Corruption',             'gavel')
on conflict (slug) do nothing;

-- ---------- complaints ----------
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null check (char_length(title) between 3 and 200),
  description text not null check (char_length(description) between 5 and 5000),
  location text,
  district text,
  image_url text,
  status public.complaint_status not null default 'open',
  vote_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists complaints_created_idx on public.complaints (created_at desc);
create index if not exists complaints_user_idx on public.complaints (user_id);
grant select, insert, update, delete on public.complaints to authenticated;
grant select on public.complaints to anon;
grant all on public.complaints to service_role;
alter table public.complaints enable row level security;

drop policy if exists "complaints readable by everyone" on public.complaints;
create policy "complaints readable by everyone" on public.complaints for select using (true);
drop policy if exists "users create own complaints" on public.complaints;
create policy "users create own complaints" on public.complaints for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users update own complaints" on public.complaints;
create policy "users update own complaints" on public.complaints for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own complaints" on public.complaints;
create policy "users delete own complaints" on public.complaints for delete to authenticated using (auth.uid() = user_id);

-- ---------- votes ----------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null default 1 check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (complaint_id, user_id)
);
grant select, insert, update, delete on public.votes to authenticated;
grant select on public.votes to anon;
grant all on public.votes to service_role;
alter table public.votes enable row level security;

drop policy if exists "votes readable by everyone" on public.votes;
create policy "votes readable by everyone" on public.votes for select using (true);
drop policy if exists "users cast own votes" on public.votes;
create policy "users cast own votes" on public.votes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users change own votes" on public.votes;
create policy "users change own votes" on public.votes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users remove own votes" on public.votes;
create policy "users remove own votes" on public.votes for delete to authenticated using (auth.uid() = user_id);

-- keep complaints.vote_count in sync
create or replace function public.sync_vote_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.complaints set vote_count = vote_count + new.value where id = new.complaint_id;
  elsif tg_op = 'DELETE' then
    update public.complaints set vote_count = vote_count - old.value where id = old.complaint_id;
  else
    update public.complaints set vote_count = vote_count - old.value + new.value where id = new.complaint_id;
  end if;
  return null;
end $$;

drop trigger if exists votes_sync_count on public.votes;
create trigger votes_sync_count
after insert or update or delete on public.votes
for each row execute function public.sync_vote_count();

-- ---------- comments ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_complaint_idx on public.comments (complaint_id, created_at);
grant select, insert, update, delete on public.comments to authenticated;
grant select on public.comments to anon;
grant all on public.comments to service_role;
alter table public.comments enable row level security;

drop policy if exists "comments readable by everyone" on public.comments;
create policy "comments readable by everyone" on public.comments for select using (true);
drop policy if exists "users write own comments" on public.comments;
create policy "users write own comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users edit own comments" on public.comments;
create policy "users edit own comments" on public.comments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications" on public.notifications for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Storage: create the buckets in Dashboard → Storage first
--   1. avatars           (public)
--   2. complaint-images  (public)
-- Then run these object policies.
-- ============================================================

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public read complaint images" on storage.objects;
create policy "public read complaint images" on storage.objects
  for select using (bucket_id = 'complaint-images');

drop policy if exists "users upload own complaint images" on storage.objects;
create policy "users upload own complaint images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'complaint-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own complaint images" on storage.objects;
create policy "users delete own complaint images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'complaint-images' and (storage.foldername(name))[1] = auth.uid()::text);
