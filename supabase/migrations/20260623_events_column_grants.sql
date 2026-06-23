-- Harden the `events` table against anon-key column exposure.
--
-- Problem: the policy `events_public_read` grants anon SELECT on *all* columns of
-- active events — including `registration_password` (the plaintext event gate code).
-- The anon key is public (shipped as NEXT_PUBLIC_SUPABASE_ANON_KEY), so anyone could
-- read the gate passwords directly via PostgREST:
--   GET /rest/v1/events?active=eq.true&select=registration_password
--
-- RLS is row-level only and cannot restrict columns, so column exposure is fixed
-- with column-level GRANTs (enforced by PostgREST alongside the existing RLS policy).
--
-- After this migration, all server-side reads of `registration_password`
-- (event-auth, /api/event) MUST use the service_role client, which bypasses RLS
-- and column grants. The code is updated accordingly in the same change.

revoke select on public.events from anon;

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
  created_at
) on public.events to anon;

-- NOTE: `registration_password` is intentionally omitted above — anon can never read it.
-- If you add a new public column to `events`, add it to this grant as well, otherwise
-- the anon-key read paths (/api/events, slug lookup) will not see the new column.
