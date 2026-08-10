-- Same problem as the EN variants, but for French: ticket pages, the ticket PDF,
-- and the registration success page all showed the German event name/location/
-- description regardless of ?lang=fr, because there was no French override column
-- to fall back to. Add it, mirroring the EN pattern (NULL falls back to German).

alter table public.events
  add column if not exists name_fr text,
  add column if not exists description_fr text,
  add column if not exists location_fr text;

-- Re-grant anon SELECT including the 3 new columns (column-level grants don't
-- auto-include new columns — see 20260623_events_column_grants.sql).
grant select (
  id,
  name,
  date,
  location,
  description,
  active,
  slug,
  category,
  registration_type,
  max_capacity,
  form_config,
  created_at,
  name_en,
  description_en,
  location_en,
  name_fr,
  description_fr,
  location_fr
) on public.events to anon;
