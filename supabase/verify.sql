-- ============================================================
-- Protidhwani — তথ্য যাচাই · Information verification
-- Claims, their attached sources and an append-only status timeline.
-- Run AFTER supabase/schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

do $$ begin
  create type public.claim_status as enum (
    'submitted','reviewing','needs_more_info','verified','misleading','false','unverifiable'
  );
exception when duplicate_object then null; end $$;

-- ---------- claims ----------
create table if not exists public.verification_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  claim_text text not null,
  context text,
  category text,
  district text,
  area text,
  status public.claim_status not null default 'submitted',
  verdict_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists verification_claims_user_idx
  on public.verification_claims (user_id, created_at desc);
create index if not exists verification_claims_status_idx
  on public.verification_claims (status, created_at desc);

grant select, insert, update, delete on public.verification_claims to authenticated;
grant select on public.verification_claims to anon;
grant all on public.verification_claims to service_role;
alter table public.verification_claims enable row level security;

drop policy if exists "claims are publicly readable" on public.verification_claims;
create policy "claims are publicly readable" on public.verification_claims
  for select using (true);

drop policy if exists "authors submit their own claims" on public.verification_claims;
create policy "authors submit their own claims" on public.verification_claims
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "authors edit their own claims" on public.verification_claims;
create policy "authors edit their own claims" on public.verification_claims
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "authors delete their own claims" on public.verification_claims;
create policy "authors delete their own claims" on public.verification_claims
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- attached sources ----------
create table if not exists public.claim_sources (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.verification_claims(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'link',            -- link | image | document | witness
  label text,
  url text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists claim_sources_claim_idx on public.claim_sources (claim_id, created_at);

grant select, insert, update, delete on public.claim_sources to authenticated;
grant select on public.claim_sources to anon;
grant all on public.claim_sources to service_role;
alter table public.claim_sources enable row level security;

drop policy if exists "sources are publicly readable" on public.claim_sources;
create policy "sources are publicly readable" on public.claim_sources
  for select using (true);

drop policy if exists "authors attach their own sources" on public.claim_sources;
create policy "authors attach their own sources" on public.claim_sources
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "authors remove their own sources" on public.claim_sources;
create policy "authors remove their own sources" on public.claim_sources
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- status timeline ----------
create table if not exists public.claim_status_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.verification_claims(id) on delete cascade,
  status public.claim_status not null,
  note text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_label text,
  created_at timestamptz not null default now()
);
create index if not exists claim_status_events_claim_idx
  on public.claim_status_events (claim_id, created_at);

grant select on public.claim_status_events to authenticated, anon;
grant insert on public.claim_status_events to authenticated;
grant all on public.claim_status_events to service_role;
alter table public.claim_status_events enable row level security;

drop policy if exists "timeline is publicly readable" on public.claim_status_events;
create policy "timeline is publicly readable" on public.claim_status_events
  for select using (true);

drop policy if exists "claim authors can add timeline notes" on public.claim_status_events;
create policy "claim authors can add timeline notes" on public.claim_status_events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.verification_claims c
      where c.id = claim_id and c.user_id = auth.uid()
    )
  );

-- ---------- triggers: keep the timeline in sync ----------
create or replace function public.log_claim_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.claim_status_events (claim_id, status, note, actor_id, actor_label)
  values (new.id, new.status, 'দাবি জমা হয়েছে · Claim received', new.user_id, 'Submitted by author');
  return new;
end $$;

drop trigger if exists claim_submitted_timeline on public.verification_claims;
create trigger claim_submitted_timeline
  after insert on public.verification_claims
  for each row execute function public.log_claim_submitted();

create or replace function public.log_claim_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.claim_status_events (claim_id, status, note, actor_id, actor_label)
    values (new.id, new.status, new.verdict_note, auth.uid(), 'Verification desk');
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists claim_status_timeline on public.verification_claims;
create trigger claim_status_timeline
  before update on public.verification_claims
  for each row execute function public.log_claim_status_change();

alter publication supabase_realtime add table public.verification_claims;
alter publication supabase_realtime add table public.claim_status_events;
