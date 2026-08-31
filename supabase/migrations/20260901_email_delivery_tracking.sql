-- Native delivery/bounce/engagement tracking via Brevo webhooks, replacing the
-- old self-hosted pixel/redirect tracking (/api/track/open, /api/track/click).
--
-- Extends the EXISTING campaign_events table instead of adding a parallel one
-- so old and new event rows live in one place.

alter table public.members add column if not exists email_status text not null default 'ok';
alter table public.members add column if not exists email_status_at timestamptz;
alter table public.members drop constraint if exists members_email_status_check;
alter table public.members add constraint members_email_status_check
  check (email_status in ('ok', 'bounced', 'complained', 'failed'));

-- member_id becomes nullable: webhook payloads only ever carry an email address,
-- which may not resolve to a known member (deleted since, or unresolved). email
-- is the new primary match key for webhook-sourced rows; member_id is still set
-- whenever it resolves, so existing per-member joins keep working for both old
-- and new event rows.
alter table public.campaign_events alter column member_id drop not null;
alter table public.campaign_events add column if not exists email text;
alter table public.campaign_events add column if not exists email_id text;
alter table public.campaign_events add column if not exists link text;

alter table public.campaign_events drop constraint if exists campaign_events_type_check;
alter table public.campaign_events add constraint campaign_events_type_check
  check (type in ('open', 'click', 'delivered', 'bounced', 'complained', 'failed'));

create index if not exists campaign_events_email_idx on public.campaign_events(email);
create index if not exists campaign_events_email_id_idx on public.campaign_events(email_id);
