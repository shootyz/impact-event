-- Row Level Security policies for all tables
-- The app uses service_role (bypasses RLS) for all server-side operations.
-- Anon key is used only for public read-only queries (events, slug lookup).
-- These policies ensure that even if the anon key is misused, data is protected.

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

alter table events enable row level security;
alter table registrations enable row level security;
alter table form_registrations enable row level security;
alter table members enable row level security;
alter table invite_codes enable row level security;
alter table campaigns enable row level security;
alter table campaign_events enable row level security;
alter table campaign_recipients enable row level security;
alter table zielgruppen enable row level security;

-- ── events: public read (active only), no write via anon ──────────────────────

create policy "events_public_read" on events
  for select to anon
  using (active = true);

-- ── All other tables: anon has NO access (service_role bypasses RLS) ──────────

-- registrations
create policy "registrations_no_anon" on registrations
  for all to anon using (false);

-- form_registrations
create policy "form_registrations_no_anon" on form_registrations
  for all to anon using (false);

-- members
create policy "members_no_anon" on members
  for all to anon using (false);

-- invite_codes
create policy "invite_codes_no_anon" on invite_codes
  for all to anon using (false);

-- campaigns
create policy "campaigns_no_anon" on campaigns
  for all to anon using (false);

-- campaign_events
create policy "campaign_events_no_anon" on campaign_events
  for all to anon using (false);

-- campaign_recipients
create policy "campaign_recipients_no_anon" on campaign_recipients
  for all to anon using (false);

-- zielgruppen
create policy "zielgruppen_no_anon" on zielgruppen
  for all to anon using (false);
