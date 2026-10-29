-- BansaRide usage counts, so you can see what people open and search for. Run once in the Supabase SQL editor.
-- Nothing personal is stored: no name, email, account or location. Only the kind of event, a route or search word, and the day.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  day date not null default current_date,
  kind text not null check (kind in ('route_open', 'search_empty')),
  ref text not null check (char_length(ref) between 1 and 60)
);
create index if not exists events_kind_day on public.events (kind, day);
alter table public.events enable row level security;
-- anyone may add a count; nobody can read them from the app (you read them in the Supabase dashboard)
create policy "anyone adds counts" on public.events for insert to anon, authenticated with check (true);

-- what to look at: Table Editor > the views below, or run "select * from public.top_routes;"
create or replace view public.top_routes with (security_invoker = true) as
  select ref as route, count(*) as opens, count(distinct day) as days
  from public.events where kind = 'route_open' group by ref order by opens desc limit 50;
create or replace view public.missing_searches with (security_invoker = true) as
  select ref as searched, count(*) as times
  from public.events where kind = 'search_empty' group by ref order by times desc limit 50;
revoke select on public.top_routes, public.missing_searches from anon, authenticated;
