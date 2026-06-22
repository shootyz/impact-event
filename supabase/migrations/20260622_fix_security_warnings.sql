-- Fix all 10 Security Advisor warnings
-- 1. Fix mutable search_path on all 3 atomic RPCs
-- 2. Revoke anon + authenticated EXECUTE on RPCs (called only via service_role in Next.js)
-- 3. Drop overly permissive "Service role full access" RLS policy on form_registrations
--    (service_role bypasses RLS anyway — the policy is redundant and flagged as always-true)

-- ── 1. Fix search_path ──────────────────────────────────────────────────────

ALTER FUNCTION public.register_form_atomic(
  p_event_id uuid, p_first_name text, p_last_name text,
  p_email text, p_company text, p_message text, p_extra_fields jsonb
) SET search_path = public;

ALTER FUNCTION public.register_invite_atomic(
  p_event_id uuid, p_name text, p_email text, p_invite_code_id uuid
) SET search_path = public;

ALTER FUNCTION public.scan_checkin_atomic(p_token uuid)
  SET search_path = public;

-- ── 2. Revoke public EXECUTE on RPCs ────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.register_form_atomic(
  uuid, text, text, text, text, text, jsonb
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.register_invite_atomic(
  uuid, text, text, uuid
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.scan_checkin_atomic(uuid)
  FROM anon, authenticated;

-- ── 3. Drop always-true RLS policy on form_registrations ────────────────────
-- service_role bypasses RLS entirely; this policy is unnecessary.

DROP POLICY IF EXISTS "Service role full access" ON public.form_registrations;
