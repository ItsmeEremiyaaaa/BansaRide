-- BansaRide accounts. Run this once in the Supabase SQL editor (Project > SQL Editor).
-- We keep only: the email (kept by Supabase Auth), the passenger type, the school, and which kind of ID a senior or PWD has.
-- No photos and no ID numbers are stored.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  passenger text not null default 'regular' check (passenger in ('elementary','highschool','college','senior','pwd','regular')),
  school text,
  id_type text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "add own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "change own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "delete own profile" on public.profiles for delete using (auth.uid() = user_id);
