-- BansaRide admin, part 2: approve marked spots, manage BTODA groups and members, suspend accounts, edit the fares,
-- and post announcements for riders. Run once in the Supabase SQL editor, after admin.sql. Safe to run again.

-- 1. Marked spots show on the map only after an admin approves them (and gives them a name).
alter table public.submissions add column if not exists name text check (char_length(name) <= 60);
alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions add constraint submissions_status_check check (status in ('new', 'approved', 'done', 'dismissed'));

create or replace function public.approved_spots()
returns table (id uuid, name text, about text, lat double precision, lon double precision)
language sql stable security definer set search_path = public as $$
  select id, coalesce(nullif(btrim(name), ''), 'Waiting spot'), about, lat, lon
  from public.submissions
  where kind = 'spot' and status = 'approved' and lat is not null
  order by created_at
$$;
revoke all on function public.approved_spots() from public;
grant execute on function public.approved_spots() to anon, authenticated;

-- 2. BTODA groups and waiting spots: changes, members, and suspension. Everyone can read (the app shows them); admins write.
--    members: [{ "name": "Juan Dela Cruz", "suspended": false }]  (names only; no phone numbers for members)
create table if not exists public.stand_edits (
  station_id text primary key check (char_length(station_id) between 1 and 80),
  name text check (char_length(name) between 2 and 60),
  landmark text check (char_length(landmark) <= 120),
  contact_name text check (char_length(contact_name) <= 40),
  contact_phone text check (contact_phone ~ '^09[0-9]{9}$'),
  verified boolean,
  suspended boolean not null default false,
  suspend_note text check (char_length(suspend_note) <= 120),
  members jsonb not null default '[]'::jsonb check (jsonb_typeof(members) = 'array' and jsonb_array_length(members) <= 200),
  updated_at timestamptz not null default now()
);
alter table public.stand_edits add column if not exists suspended boolean not null default false;
alter table public.stand_edits add column if not exists suspend_note text check (char_length(suspend_note) <= 120);
alter table public.stand_edits add column if not exists members jsonb not null default '[]'::jsonb;
alter table public.stand_edits enable row level security;
drop policy if exists "anyone reads stand edits" on public.stand_edits;
create policy "anyone reads stand edits" on public.stand_edits for select to anon, authenticated using (true);
drop policy if exists "admins add stand edits" on public.stand_edits;
create policy "admins add stand edits" on public.stand_edits for insert to authenticated with check (public.is_admin());
drop policy if exists "admins change stand edits" on public.stand_edits;
create policy "admins change stand edits" on public.stand_edits for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins remove stand edits" on public.stand_edits;
create policy "admins remove stand edits" on public.stand_edits for delete to authenticated using (public.is_admin());

-- 3. Suspended accounts: they can still look around, but cannot post fare reports or comments, or report posts.
create table if not exists public.suspensions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text check (char_length(reason) <= 120),
  created_at timestamptz not null default now()
);
alter table public.suspensions enable row level security;
drop policy if exists "admins read suspensions" on public.suspensions;
create policy "admins read suspensions" on public.suspensions for select to authenticated using (public.is_admin() or user_id = auth.uid());
drop policy if exists "admins add suspensions" on public.suspensions;
create policy "admins add suspensions" on public.suspensions for insert to authenticated with check (public.is_admin());
drop policy if exists "admins remove suspensions" on public.suspensions;
create policy "admins remove suspensions" on public.suspensions for delete to authenticated using (public.is_admin());

create or replace function public.block_suspended() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.suspensions where user_id = new.user_id) then raise exception 'suspended'; end if;
  return new;
end $$;
drop trigger if exists posts_block_suspended on public.posts;
create trigger posts_block_suspended before insert on public.posts for each row execute function public.block_suspended();
revoke all on function public.block_suspended() from public, anon, authenticated;

create or replace function public.report_post(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign_in'; end if;
  if exists (select 1 from public.suspensions where user_id = auth.uid()) then raise exception 'suspended'; end if;
  insert into public.post_reports (post_id, user_id) select p, auth.uid() where exists (select 1 from public.posts where id = p and user_id <> auth.uid()) on conflict do nothing;
  if found then
    update public.posts set reports = reports + 1, status = case when reports + 1 >= 3 then 'hidden' else status end where id = p;
  end if;
end $$;

-- the accounts list, now with suspension
drop function if exists public.admin_users();
create function public.admin_users()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, display_name text, passenger text, school text, id_type text, is_admin boolean, suspended boolean, suspend_reason text,
              posts_count bigint, reports_made bigint, last_post_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at, p.display_name, p.passenger, p.school, p.id_type,
           exists (select 1 from public.admins a where a.user_id = u.id),
           s.user_id is not null, s.reason,
           (select count(*) from public.posts x where x.user_id = u.id),
           (select count(*) from public.post_reports r where r.user_id = u.id),
           (select max(x.created_at) from public.posts x where x.user_id = u.id)
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.suspensions s on s.user_id = u.id
    order by u.created_at desc limit 500;
end $$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- 4. App settings, such as the fares. Everyone can read them; only admins write.
create table if not exists public.app_settings (
  key text primary key check (key in ('fares')),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "anyone reads settings" on public.app_settings;
create policy "anyone reads settings" on public.app_settings for select to anon, authenticated using (true);
drop policy if exists "admins add settings" on public.app_settings;
create policy "admins add settings" on public.app_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "admins change settings" on public.app_settings;
create policy "admins change settings" on public.app_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. Announcements for riders: shown in the app, and as a pin on the map when a place is given.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  body text check (char_length(body) <= 400),
  tone text not null default 'info' check (tone in ('info', 'warn', 'danger')),
  lat double precision,
  lon double precision,
  active boolean not null default true,
  ends_at timestamptz,
  rain_only boolean not null default false, -- e.g. a muddy road: shown only while it rains in Bansalan
  created_at timestamptz not null default now()
);
alter table public.announcements add column if not exists rain_only boolean not null default false;
alter table public.announcements enable row level security;
drop policy if exists "anyone reads live announcements" on public.announcements;
create policy "anyone reads live announcements" on public.announcements for select to anon, authenticated
  using ((active and (ends_at is null or ends_at > now())) or public.is_admin());
drop policy if exists "admins add announcements" on public.announcements;
create policy "admins add announcements" on public.announcements for insert to authenticated with check (public.is_admin());
drop policy if exists "admins change announcements" on public.announcements;
create policy "admins change announcements" on public.announcements for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins remove announcements" on public.announcements;
create policy "admins remove announcements" on public.announcements for delete to authenticated using (public.is_admin());
