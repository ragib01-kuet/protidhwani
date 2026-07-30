-- ============================================================
-- Protidhwani — Protest Mode
-- প্রতিবাদ মোড · verified safe routes, crowd updates, announcements
-- Run AFTER supabase/schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

do $$ begin
  create type public.protest_kind as enum ('route','crowd','announcement','firstaid','legal');
exception when duplicate_object then null; end $$;

create table if not exists public.protest_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.protest_kind not null default 'announcement',
  title_bn text not null,
  title_en text,
  body text,
  place text,
  district text,
  upazila text,
  lat double precision,
  lng double precision,
  verified boolean not null default false,
  confirmations int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists protest_updates_recent_idx
  on public.protest_updates (created_at desc);
create index if not exists protest_updates_area_idx
  on public.protest_updates (district, created_at desc);

grant select, insert, update on public.protest_updates to authenticated;
grant select on public.protest_updates to anon;
grant all on public.protest_updates to service_role;
alter table public.protest_updates enable row level security;

drop policy if exists "protest updates readable by everyone" on public.protest_updates;
create policy "protest updates readable by everyone" on public.protest_updates
  for select using (true);

drop policy if exists "users post their own protest updates" on public.protest_updates;
create policy "users post their own protest updates" on public.protest_updates
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "authors edit their protest updates" on public.protest_updates;
create policy "authors edit their protest updates" on public.protest_updates
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- community confirmations ----------
create table if not exists public.protest_confirmations (
  update_id uuid not null references public.protest_updates(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (update_id, user_id)
);

grant select, insert, delete on public.protest_confirmations to authenticated;
grant select on public.protest_confirmations to anon;
grant all on public.protest_confirmations to service_role;
alter table public.protest_confirmations enable row level security;

drop policy if exists "confirmations readable by everyone" on public.protest_confirmations;
create policy "confirmations readable by everyone" on public.protest_confirmations
  for select using (true);

drop policy if exists "users confirm as themselves" on public.protest_confirmations;
create policy "users confirm as themselves" on public.protest_confirmations
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users withdraw their confirmation" on public.protest_confirmations;
create policy "users withdraw their confirmation" on public.protest_confirmations
  for delete to authenticated using (auth.uid() = user_id);

-- Recount + auto-verify at 3 independent confirmations.
create or replace function public.sync_protest_confirmations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.update_id, old.update_id);
  total int;
begin
  select count(*) into total from public.protest_confirmations where update_id = target;
  update public.protest_updates
     set confirmations = total,
         verified = (total >= 3),
         updated_at = now()
   where id = target;
  return null;
end;
$$;

drop trigger if exists protest_confirmations_sync on public.protest_confirmations;
create trigger protest_confirmations_sync
  after insert or delete on public.protest_confirmations
  for each row execute function public.sync_protest_confirmations();

do $$ begin
  alter publication supabase_realtime add table public.protest_updates;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.protest_confirmations;
exception when duplicate_object then null; end $$;
