-- Events had a single name/description/location, always shown regardless of the
-- viewer's ?lang= — so the English registration page rendered German event content.
-- Add optional English variants; NULL falls back to the base (German) field.

alter table public.events
  add column if not exists name_en text,
  add column if not exists description_en text,
  add column if not exists location_en text;

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
  location_en
) on public.events to anon;
