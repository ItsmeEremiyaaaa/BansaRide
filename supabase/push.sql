-- BansaRide ride alerts (push notifications). Run once in the Supabase SQL editor.
-- A person can turn on alerts for the big bus, van and mini bus without an account. We keep only the phone's push address
-- and which rides they picked. Nothing is readable from the app: everything goes through the two functions below.
create table if not exists public.push_subscriptions (
  token text primary key check (char_length(token) between 16 and 64),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  modes text[] not null default '{}' check (modes <@ array['bus', 'van', 'mini']),
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security; -- no policies on purpose

-- remembers which alert was already sent today, so nobody gets it twice
create table if not exists public.alerts_sent (
  day date not null,
  mode text not null,
  kind text not null check (kind in ('first', 'last')),
  primary key (day, mode, kind)
);
alter table public.alerts_sent enable row level security; -- no policies on purpose

create or replace function public.save_push(p_token text, p_endpoint text, p_p256dh text, p_auth text, p_modes text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint and token <> p_token;
  insert into public.push_subscriptions (token, endpoint, p256dh, auth, modes)
  values (p_token, p_endpoint, p_p256dh, p_auth, coalesce(p_modes, '{}'))
  on conflict (token) do update set endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth, modes = excluded.modes;
end $$;

create or replace function public.remove_push(p_token text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where token = p_token;
$$;

revoke all on function public.save_push(text, text, text, text, text[]) from public;
revoke all on function public.remove_push(text) from public;
grant execute on function public.save_push(text, text, text, text, text[]) to anon, authenticated;
grant execute on function public.remove_push(text) to anon, authenticated;
