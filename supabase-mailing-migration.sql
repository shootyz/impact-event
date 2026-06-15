-- Members: the fixed mailing list (Impact Circle members, uploaded via CSV)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  unsubscribe_token text not null default gen_random_uuid()::text,
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Campaigns: sent mailings archive
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  header_image_url text,
  body_html text not null,
  event_url text,
  sent_at timestamptz,
  recipient_count integer,
  created_at timestamptz not null default now()
);

-- Invite codes: one per member per event
create table if not exists invite_codes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  code text not null unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Add invite_code_id to registrations (nullable = walk-ins don't need one)
alter table registrations add column if not exists invite_code_id uuid references invite_codes(id);
