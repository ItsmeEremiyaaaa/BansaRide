-- BansaRide hardening. Run once in the Supabase SQL editor, after the other files. Safe to run again.
-- 1. Ride alerts can only be saved for real push services, with sensible sizes, and the list has a cap.
-- 2. The "10 posts a day" limit can no longer be skipped by sending many posts at the same moment.
-- 3. The inbox and the usage counts stop growing without limit when someone floods them.

-- 1. Ride alerts. "not valid" means new rows are checked and rows already saved are left alone.
alter table public.push_subscriptions drop constraint if exists push_endpoint_real;
alter table public.push_subscriptions add constraint push_endpoint_real check (
  char_length(endpoint) <= 500 and char_length(p256dh) <= 100 and char_length(auth) <= 40
  and endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/'
) not valid;

create or replace function public.save_push(p_token text, p_endpoint text, p_p256dh text, p_auth text, p_modes text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint and token <> p_token;
  if not exists (select 1 from public.push_subscriptions where token = p_token)
     and (select count(*) from public.push_subscriptions) >= 20000 then
    raise exception 'full';
  end if;
  insert into public.push_subscriptions (token, endpoint, p256dh, auth, modes)
  values (p_token, p_endpoint, p_p256dh, p_auth, coalesce(p_modes, '{}'))
  on conflict (token) do update set endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth, modes = excluded.modes;
end $$;

-- 2. Posts. The same function as in community.sql, with one lock line first: posts of one person are checked one at a time.
create or replace function public.check_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
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

-- 3. Caps. Anyone can send a report or a count, so each table accepts only so many an hour.
--    A flood stops at the cap instead of filling the inbox and the database.
--    shortcut: one cap for everybody, not one per person. One flooder can use it up for an hour; upgrade to a captcha or an edge function if that happens.
alter table public.events add column if not exists created_at timestamptz not null default now();
create index if not exists events_created on public.events (created_at);

create or replace function public.cap_submissions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.submissions where created_at > now() - interval '1 hour') >= 100 then raise exception 'busy'; end if;
  return new;
end $$;
drop trigger if exists submissions_cap on public.submissions;
create trigger submissions_cap before insert on public.submissions for each row execute function public.cap_submissions();
revoke all on function public.cap_submissions() from public, anon, authenticated;

create or replace function public.cap_events() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.events where created_at > now() - interval '1 hour') >= 5000 then raise exception 'busy'; end if;
  return new;
end $$;
drop trigger if exists events_cap on public.events;
create trigger events_cap before insert on public.events for each row execute function public.cap_events();
revoke all on function public.cap_events() from public, anon, authenticated;
