-- BansaRide community: display names, fare reports and short comments, with filters and reports.
-- The filters run here too, so they cannot be skipped from the app. Run once in the Supabase SQL editor.

alter table public.profiles add column if not exists display_name text;

create table if not exists public.blocked_words (word text primary key, whole boolean not null default false);
alter table public.blocked_words enable row level security; -- no policies: only the functions below can read it
insert into public.blocked_words (word, whole) values
  ('putang', false),
  ('putangina', false),
  ('tangina', false),
  ('tarantado', false),
  ('pakyu', false),
  ('punyeta', false),
  ('bwisit', false),
  ('buwisit', false),
  ('kantot', false),
  ('jakol', false),
  ('pekpek', false),
  ('demonyo', false),
  ('fuck', false),
  ('shit', false),
  ('bitch', false),
  ('pussy', false),
  ('nigger', false),
  ('nigga', false),
  ('retard', false),
  ('puta', true),
  ('pota', true),
  ('gago', true),
  ('gaga', true),
  ('ulol', true),
  ('bobo', true),
  ('tanga', true),
  ('inutil', true),
  ('hayop', true),
  ('leche', true),
  ('kupal', true),
  ('lintik', true),
  ('yawa', true),
  ('piste', true),
  ('pisti', true),
  ('puke', true),
  ('titi', true),
  ('tite', true),
  ('tae', true),
  ('dick', true),
  ('bastos', true),
  ('animal', true)
on conflict (word) do nothing;

-- Turns "p*t4  a" into "puta"-like text so spelling tricks do not get through.
create or replace function public.mod_blocked(t text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  n text := translate(lower(coalesce(t, '')), '0134578@$!', 'oieastbasi');
  spaced text := ' ' || regexp_replace(regexp_replace(n, '[^a-z]+', ' ', 'g'), '(.)\1+', '\1', 'g') || ' ';
  squashed text := regexp_replace(regexp_replace(n, '[^a-z]+', '', 'g'), '(.)\1+', '\1', 'g');
begin
  return exists (
    select 1 from public.blocked_words w
    where (w.whole and spaced like '% ' || regexp_replace(w.word, '(.)\1+', '\1', 'g') || ' %')
       or (not w.whole and squashed like '%' || regexp_replace(w.word, '(.)\1+', '\1', 'g') || '%')
  );
end $$;

create or replace function public.mod_contact(t text) returns boolean
language sql immutable as $$ select coalesce(t, '') ~* 'https?:|www\.|\.(com|net|ph|org)\y|\d[\d\s-]{6,}\d|[#@]' $$;

-- display names
create or replace function public.check_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.display_name is not null then
    new.display_name := btrim(new.display_name);
    if char_length(new.display_name) not between 3 and 20 then raise exception 'name_length'; end if;
    if new.display_name !~ '^[[:alnum:] .''_-]+$' or public.mod_contact(new.display_name) or public.mod_blocked(new.display_name) then
      raise exception 'name_not_allowed';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_check on public.profiles;
create trigger profiles_check before insert or update on public.profiles for each row execute function public.check_profile();

-- fare reports and comments
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  kind text not null check (kind in ('fare', 'comment')),
  route_id text, place_id text, station_id text,
  passenger text, paid int, body text,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  reports int not null default 0,
  created_at timestamptz not null default now(),
  check (route_id is not null or place_id is not null or station_id is not null)
);
create index if not exists posts_route on public.posts (route_id) where route_id is not null;
create index if not exists posts_place on public.posts (place_id) where place_id is not null;
create index if not exists posts_station on public.posts (station_id) where station_id is not null;
alter table public.posts enable row level security;
create policy "read visible posts" on public.posts for select using (status = 'visible' or auth.uid() = user_id);
create policy "add own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "delete own posts" on public.posts for delete using (auth.uid() = user_id);

create or replace function public.check_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  select display_name into nm from public.profiles where user_id = new.user_id;
  if nm is null then raise exception 'need_name'; end if;
  if (select count(*) from public.posts where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then raise exception 'too_many'; end if;
  new.author_name := nm; new.status := 'visible'; new.reports := 0; new.created_at := now();
  if new.kind = 'fare' then
    if new.route_id is null or new.paid is null or new.paid not between 5 and 1000 then raise exception 'bad_fare'; end if;
    if new.passenger not in ('elementary','highschool','college','senior','pwd','adult') then raise exception 'bad_fare'; end if;
    new.body := null;
  else
    new.body := btrim(coalesce(new.body, ''));
    new.paid := null; new.passenger := null;
    if char_length(new.body) not between 3 and 140 then raise exception 'bad_comment'; end if;
    if public.mod_contact(new.body) or public.mod_blocked(new.body) then raise exception 'comment_not_allowed'; end if;
  end if;
  return new;
end $$;
drop trigger if exists posts_check on public.posts;
create trigger posts_check before insert on public.posts for each row execute function public.check_post();

-- reports: three different people hide a post until it is reviewed
create table if not exists public.post_reports (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.post_reports enable row level security; -- no policies: only report_post() writes here

create or replace function public.report_post(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign_in'; end if;
  insert into public.post_reports (post_id, user_id) select p, auth.uid() where exists (select 1 from public.posts where id = p and user_id <> auth.uid()) on conflict do nothing;
  if found then
    update public.posts set reports = reports + 1, status = case when reports + 1 >= 3 then 'hidden' else status end where id = p;
  end if;
end $$;
revoke all on function public.report_post(uuid) from public, anon;
grant execute on function public.report_post(uuid) to authenticated;
revoke all on function public.mod_blocked(text) from public, anon, authenticated;
revoke all on function public.check_post() from public, anon, authenticated;
revoke all on function public.check_profile() from public, anon, authenticated;
