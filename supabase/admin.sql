-- BansaRide admin: who is an admin, what admins may see and change, the inbox for problem reports and new waiting
-- spots, and the usage counts. Every admin permission is checked here in the database, not only in the app.

-- who is an admin (add more in the dashboard: insert into public.admins (user_id) values ('...'))
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());

-- posts, reports, blocked words and profiles: admins can review them
drop policy if exists "admins read all posts" on public.posts;
create policy "admins read all posts" on public.posts for select to authenticated using (public.is_admin());
drop policy if exists "admins change posts" on public.posts;
create policy "admins change posts" on public.posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete posts" on public.posts;
create policy "admins delete posts" on public.posts for delete to authenticated using (public.is_admin());

drop policy if exists "admins read reports" on public.post_reports;
create policy "admins read reports" on public.post_reports for select to authenticated using (public.is_admin());
drop policy if exists "admins clear reports" on public.post_reports;
create policy "admins clear reports" on public.post_reports for delete to authenticated using (public.is_admin());

drop policy if exists "admins read words" on public.blocked_words;
create policy "admins read words" on public.blocked_words for select to authenticated using (public.is_admin());
drop policy if exists "admins add words" on public.blocked_words;
create policy "admins add words" on public.blocked_words for insert to authenticated with check (public.is_admin());
drop policy if exists "admins remove words" on public.blocked_words;
create policy "admins remove words" on public.blocked_words for delete to authenticated using (public.is_admin());

drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles for select to authenticated using (public.is_admin());

-- usage counts (what people open and what searches find nothing). Nothing personal is stored.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  day date not null default current_date,
  kind text not null check (kind in ('route_open', 'search_empty')),
  ref text not null check (char_length(ref) between 1 and 60)
);
create index if not exists events_kind_day on public.events (kind, day);
alter table public.events enable row level security;
drop policy if exists "anyone adds counts" on public.events;
create policy "anyone adds counts" on public.events for insert to anon, authenticated with check (true);
drop policy if exists "admins read counts" on public.events;
create policy "admins read counts" on public.events for select to authenticated using (public.is_admin());

-- the inbox: "Report a problem" and "Add a waiting spot" are saved here as well as shared
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('problem', 'spot')),
  topic text check (char_length(topic) <= 60),
  about text check (char_length(about) <= 80),
  body text check (char_length(body) <= 300),
  lat double precision,
  lon double precision,
  page text check (char_length(page) <= 200),
  status text not null default 'new' check (status in ('new', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists submissions_status on public.submissions (status, created_at desc);
alter table public.submissions enable row level security;
drop policy if exists "anyone sends" on public.submissions;
create policy "anyone sends" on public.submissions for insert to anon, authenticated with check (
  status = 'new' and (
    (kind = 'problem' and char_length(coalesce(body, '')) >= 3)
    or (kind = 'spot' and lat between 6.5 and 7.2 and lon between 125.0 and 125.5)
  )
);
drop policy if exists "admins read submissions" on public.submissions;
create policy "admins read submissions" on public.submissions for select to authenticated using (public.is_admin());
drop policy if exists "admins change submissions" on public.submissions;
create policy "admins change submissions" on public.submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete submissions" on public.submissions;
create policy "admins delete submissions" on public.submissions for delete to authenticated using (public.is_admin());

-- the overview numbers in one call
create or replace function public.admin_overview() returns json
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return json_build_object(
    'users', (select count(*) from auth.users),
    'users_week', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'discount', (select coalesce(json_object_agg(passenger, n), '{}'::json) from (select passenger, count(*) n from public.profiles where passenger is not null group by passenger) x),
    'posts', (select count(*) from public.posts),
    'hidden', (select count(*) from public.posts where status <> 'visible'),
    'reported', (select count(*) from public.posts where reports > 0),
    'inbox', (select count(*) from public.submissions where status = 'new'),
    'push', (select count(*) from public.push_subscriptions),
    'push_modes', (select coalesce(json_object_agg(m, n), '{}'::json) from (select unnest(modes) m, count(*) n from public.push_subscriptions group by 1) x),
    'opens_week', (select count(*) from public.events where kind = 'route_open' and day > current_date - 7),
    'top_routes', (select coalesce(json_agg(x), '[]'::json) from (select ref, count(*) n from public.events where kind = 'route_open' and day > current_date - 30 group by ref order by n desc limit 8) x),
    'missing', (select coalesce(json_agg(x), '[]'::json) from (select ref, count(*) n from public.events where kind = 'search_empty' and day > current_date - 30 group by ref order by n desc limit 8) x)
  );
end $$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- the accounts list (the email lives in the auth schema, which the app cannot read directly)
create or replace function public.admin_users()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, display_name text, passenger text, school text, id_type text, is_admin boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at, p.display_name, p.passenger, p.school, p.id_type,
           exists (select 1 from public.admins a where a.user_id = u.id)
    from auth.users u left join public.profiles p on p.user_id = u.id
    order by u.created_at desc limit 500;
end $$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- the first admin: the app owner
insert into public.admins (user_id) select id from auth.users where email = 'jeremiahescubido05@gmail.com' on conflict do nothing;
