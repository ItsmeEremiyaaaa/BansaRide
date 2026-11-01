-- BansaRide weather notices when the app is closed (rain, storm, very hot, dangerous heat).
-- Run once in the Supabase SQL editor, after push.sql, then redeploy the function send-ride-alerts. Safe to run again.
-- A phone picks "Weather" next to the rides; the function checks the weather every 5 minutes and sends each notice once a day.

-- "weather" becomes a thing a phone can pick (next to bus, van and mini bus)
alter table public.push_subscriptions drop constraint if exists push_subscriptions_modes_check;
alter table public.push_subscriptions add constraint push_subscriptions_modes_check check (modes <@ array['bus', 'van', 'mini', 'weather']);

-- and the function may remember which weather notice it already sent today
alter table public.alerts_sent drop constraint if exists alerts_sent_kind_check;
alter table public.alerts_sent add constraint alerts_sent_kind_check check (kind in ('first', 'last', 'rain', 'storm', 'heat', 'danger'));
