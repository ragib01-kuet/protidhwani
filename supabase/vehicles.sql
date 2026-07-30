-- Optional live vehicle registry for the /vehicle page.
-- Run this in your Supabase SQL editor to switch the page from the seeded demo
-- registry to live data. The page works either way.

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  plate_normalized text not null unique,
  registered boolean not null default true,
  owner_verified boolean not null default false,
  type_bn text,
  type_en text,
  model_bn text,
  model_en text,
  registration_expiry text,
  fitness_valid boolean not null default false,
  tax_token_valid boolean not null default false,
  created_at timestamptz not null default now()
);

grant select on public.vehicles to anon, authenticated;
grant all on public.vehicles to service_role;

alter table public.vehicles enable row level security;

drop policy if exists "vehicles are publicly readable" on public.vehicles;
create policy "vehicles are publicly readable"
  on public.vehicles for select
  using (true);

create table if not exists public.vehicle_reports (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  plate_normalized text not null,
  kind text not null check (kind in ('reckless','harassment','fake_plate','accident','other')),
  note_bn text not null check (char_length(note_bn) between 3 and 500),
  note_en text,
  verified boolean not null default false,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_reports_plate_idx
  on public.vehicle_reports (plate_normalized, created_at desc);

grant select on public.vehicle_reports to anon, authenticated;
grant insert, update, delete on public.vehicle_reports to authenticated;
grant all on public.vehicle_reports to service_role;

alter table public.vehicle_reports enable row level security;

drop policy if exists "reports are publicly readable" on public.vehicle_reports;
create policy "reports are publicly readable"
  on public.vehicle_reports for select
  using (true);

drop policy if exists "users insert own reports" on public.vehicle_reports;
create policy "users insert own reports"
  on public.vehicle_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users delete own reports" on public.vehicle_reports;
create policy "users delete own reports"
  on public.vehicle_reports for delete
  to authenticated
  using (auth.uid() = user_id);

-- Seed the same demo plates so live mode matches the demo registry.
insert into public.vehicles
  (plate, plate_normalized, registered, owner_verified, type_bn, type_en, model_bn, model_en, registration_expiry, fitness_valid, tax_token_valid)
values
  ('ঢাকা মেট্রো-গ ১১-২৩৪৫', 'ঢাকামেট্রোগ112345', true, true, 'প্রাইভেট কার', 'Private car', 'টয়োটা এক্সিও ২০১৬', 'Toyota Axio 2016', '2027', true, true),
  ('ঢাকা মেট্রো-খ ১৯-৭৭০২', 'ঢাকামেট্রোখ197702', true, false, 'সিএনজি অটোরিকশা', 'CNG auto-rickshaw', 'বাজাজ ২০১৯', 'Bajaj 2019', '2026', false, true),
  ('চট্ট মেট্রো-ল ১৩-০৪৫৬', 'চট্টমেট্রোল130456', false, true, 'পিকআপ ভ্যান', 'Pickup van', 'মাহিন্দ্রা ২০১৪', 'Mahindra 2014', '2023', false, false)
on conflict (plate_normalized) do nothing;
