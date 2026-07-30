-- ============================================================
-- Protidhwani — Emergency SOS + Blood alerts
-- জরুরি সহায়তা · SOS broadcast, blood requests, live tracking
-- Run AFTER supabase/schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

do $$ begin
  create type public.sos_kind as enum ('sos','medical','fire','police','missing','blood','text');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sos_status as enum ('active','responding','resolved','cancelled');
exception when duplicate_object then null; end $$;

-- ---------- alerts ----------
create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.sos_kind not null default 'sos',
  status public.sos_status not null default 'active',
  message text,
  contact_phone text,
  -- area scope: the community that gets notified
  district text,
  upazila text,
  union_name text,
  -- last known position (updated by the tracker)
  lat double precision,
  lng double precision,
  accuracy_m double precision,
  -- blood alert fields
  blood_group text,
  units_needed int,
  hospital text,
  responders int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists sos_alerts_area_idx on public.sos_alerts (district, upazila, created_at desc);
create index if not exists sos_alerts_status_idx on public.sos_alerts (status, created_at desc);

grant select, insert, update on public.sos_alerts to authenticated;
grant select on public.sos_alerts to anon;
grant all on public.sos_alerts to service_role;
alter table public.sos_alerts enable row level security;

drop policy if exists "alerts readable by everyone" on public.sos_alerts;
create policy "alerts readable by everyone" on public.sos_alerts
  for select using (true);

drop policy if exists "users raise their own alerts" on public.sos_alerts;
create policy "users raise their own alerts" on public.sos_alerts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "owners update their alerts" on public.sos_alerts;
create policy "owners update their alerts" on public.sos_alerts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- live location trail ----------
create table if not exists public.sos_pings (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.sos_alerts(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  created_at timestamptz not null default now()
);
create index if not exists sos_pings_alert_idx on public.sos_pings (alert_id, created_at desc);

grant select, insert on public.sos_pings to authenticated;
grant select on public.sos_pings to anon;
grant all on public.sos_pings to service_role;
alter table public.sos_pings enable row level security;

drop policy if exists "pings readable by everyone" on public.sos_pings;
create policy "pings readable by everyone" on public.sos_pings
  for select using (true);

drop policy if exists "owner writes pings" on public.sos_pings;
create policy "owner writes pings" on public.sos_pings
  for insert to authenticated
  with check (exists (select 1 from public.sos_alerts a where a.id = alert_id and a.user_id = auth.uid()));

-- ---------- community acknowledgements ----------
create table if not exists public.sos_responses (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.sos_alerts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (alert_id, user_id)
);

grant select, insert, delete on public.sos_responses to authenticated;
grant select on public.sos_responses to anon;
grant all on public.sos_responses to service_role;
alter table public.sos_responses enable row level security;

drop policy if exists "responses readable by everyone" on public.sos_responses;
create policy "responses readable by everyone" on public.sos_responses for select using (true);

drop policy if exists "users respond as themselves" on public.sos_responses;
create policy "users respond as themselves" on public.sos_responses
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users withdraw their response" on public.sos_responses;
create policy "users withdraw their response" on public.sos_responses
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- fan-out: notify every community member ----------
-- Every alert raised in an area writes a notification row for each profile
-- in the same district (and, when known, the same upazila).
create or replace function public.notify_community_on_sos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, link)
  select p.id,
         case new.kind
           when 'blood' then 'রক্তের জরুরি ডাক · Blood alert'
           else 'জরুরি এসওএস · Emergency SOS'
         end,
         coalesce(new.message, 'আপনার এলাকায় জরুরি সহায়তা প্রয়োজন · Help needed in your area'),
         '/emergency?alert=' || new.id::text
  from public.profiles p
  where p.id <> new.user_id
    and (new.district is null or p.district is null or p.district = new.district);
  return new;
end;
$$;

drop trigger if exists sos_alerts_notify on public.sos_alerts;
create trigger sos_alerts_notify
  after insert on public.sos_alerts
  for each row execute function public.notify_community_on_sos();

alter publication supabase_realtime add table public.sos_alerts;
alter publication supabase_realtime add table public.sos_pings;
