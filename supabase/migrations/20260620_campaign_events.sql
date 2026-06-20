-- Campaign open/click tracking events
create table if not exists campaign_events (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  type        text not null check (type in ('open', 'click')),
  created_at  timestamptz not null default now()
);

create index if not exists campaign_events_campaign_id_idx on campaign_events(campaign_id);
create index if not exists campaign_events_member_id_idx on campaign_events(member_id);

-- Unique open per member per campaign (prevent pixel double-counting)
create unique index if not exists campaign_events_unique_open
  on campaign_events(campaign_id, member_id)
  where type = 'open';
