-- Add registration_type and max_capacity to events
alter table events add column if not exists registration_type text not null default 'invite' check (registration_type in ('invite', 'form'));
alter table events add column if not exists max_capacity integer;

-- Form registrations table (for form-type events)
create table if not exists form_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  company     text,
  message     text,
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'waitlisted')),
  created_at  timestamptz not null default now()
);

create index if not exists form_registrations_event_id_idx on form_registrations(event_id);
create index if not exists form_registrations_email_idx on form_registrations(email);
create index if not exists form_registrations_status_idx on form_registrations(status);

-- RLS
alter table form_registrations enable row level security;
create policy "Service role full access" on form_registrations using (true) with check (true);
