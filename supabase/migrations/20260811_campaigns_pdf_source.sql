-- The ticket PDF's "Zeitplan" (program) block was auto-picked from the most recently
-- sent campaign, falling back to the newest draft. But sent campaigns can never be
-- edited again (no edit button once sent_at is set) — so there was no way to fix a
-- schedule mistake after sending without either re-emailing everyone or leaving the
-- ticket wrong forever. Explicit control instead: an admin marks whichever campaign
-- (sent or draft) should feed the PDF, independent of send status.

alter table public.campaigns
  add column if not exists is_pdf_source boolean not null default false;

comment on column public.campaigns.is_pdf_source is
  'When true, this campaign''s "program" block feeds the ticket PDF for its event_id + blocks_json.lang. At most one campaign per (event_id, lang) should have this set — enforced in application code, not a DB constraint.';
