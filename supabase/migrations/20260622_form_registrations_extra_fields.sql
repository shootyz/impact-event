-- Add extra_fields column to form_registrations (was missing from initial migration)
alter table form_registrations add column if not exists extra_fields jsonb;
