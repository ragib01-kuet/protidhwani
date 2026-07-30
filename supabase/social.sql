-- ============================================================
-- Protidhwani — Social graph + direct messages
-- বন্ধুত্ব ও বার্তা · Friendships and messaging
-- Run AFTER supabase/schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type public.friend_status as enum ('pending','accepted','declined','blocked');
exception when duplicate_object then null; end $$;

-- ---------- friend requests / friendships ----------
-- One row per ordered pair (requester → addressee). Accepted rows are
-- friendships in both directions; pending rows are Facebook-style requests.
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_requests_no_self check (requester_id <> addressee_id),
  constraint friend_requests_pair_unique unique (requester_id, addressee_id)
);
create index if not exists friend_requests_requester_idx on public.friend_requests (requester_id, status);
create index if not exists friend_requests_addressee_idx on public.friend_requests (addressee_id, status);

grant select, insert, update, delete on public.friend_requests to authenticated;
grant all on public.friend_requests to service_role;
alter table public.friend_requests enable row level security;

drop policy if exists "friend rows visible to both sides" on public.friend_requests;
create policy "friend rows visible to both sides" on public.friend_requests
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "only the requester can send" on public.friend_requests;
create policy "only the requester can send" on public.friend_requests
  for insert to authenticated
  with check (auth.uid() = requester_id);

drop policy if exists "either side can update the link" on public.friend_requests;
create policy "either side can update the link" on public.friend_requests
  for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "either side can remove the link" on public.friend_requests;
create policy "either side can remove the link" on public.friend_requests
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Are two users friends? Security definer so message policies never recurse.
create or replace function public.are_friends(_a uuid, _b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friend_requests fr
    where fr.status = 'accepted'
      and ((fr.requester_id = _a and fr.addressee_id = _b)
        or (fr.requester_id = _b and fr.addressee_id = _a))
  )
$$;

grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- ---------- direct messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_no_self check (sender_id <> recipient_id)
);
create index if not exists messages_pair_idx on public.messages (sender_id, recipient_id, created_at desc);
create index if not exists messages_inbox_idx on public.messages (recipient_id, created_at desc);

grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;

drop policy if exists "participants read their thread" on public.messages;
create policy "participants read their thread" on public.messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "send as yourself" on public.messages;
create policy "send as yourself" on public.messages
  for insert to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "recipient marks read" on public.messages;
create policy "recipient marks read" on public.messages
  for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "sender can delete" on public.messages;
create policy "sender can delete" on public.messages
  for delete to authenticated
  using (auth.uid() = sender_id);

-- ---------- profile discovery (people search) ----------
-- People search needs to read other users' basic profile cards.
drop policy if exists "profiles are readable for discovery" on public.profiles;
create policy "profiles are readable for discovery" on public.profiles
  for select to authenticated
  using (true);

-- ---------- realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null; end $$;
