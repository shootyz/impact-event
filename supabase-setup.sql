-- Führe dieses SQL in deinem Supabase SQL Editor aus
-- (https://app.supabase.com → dein Projekt → SQL Editor)

-- Events Tabelle
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date timestamptz not null,
  location text not null,
  description text,
  active boolean default false,
  registration_password text,
  created_at timestamptz default now()
);

-- Migration für bestehende Installationen:
-- alter table events add column if not exists registration_password text;

-- Registrierungen Tabelle
create table if not exists registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  name text not null,
  email text not null,
  qr_token uuid not null unique,
  checked_in boolean default false,
  checked_in_at timestamptz,
  created_at timestamptz default now()
);

-- Index für schnelle QR-Code-Suche
create index if not exists registrations_qr_token_idx on registrations(qr_token);
create index if not exists registrations_event_id_idx on registrations(event_id);

-- Row Level Security (öffentliches Lesen erlauben für Event-Infos)
alter table events enable row level security;
alter table registrations enable row level security;

-- Policy: Jeder kann aktive Events lesen
create policy "Public can read active events"
  on events for select
  using (active = true);

-- Policy: Service Role hat vollen Zugriff (für API-Routen)
-- (Service Role bypassed RLS automatisch)

-- Beispiel-Event einfügen (anpassen!)
insert into events (name, date, location, description, active)
values (
  'Impact Gstaad Summer Evening',
  '2025-07-15 19:00:00+01',
  'Gstaad Palace, Palacestrasse 28, 3780 Gstaad',
  'Ein exklusiver Abend mit Networking und Inspiration.',
  true
);
