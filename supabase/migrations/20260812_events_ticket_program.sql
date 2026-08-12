-- Ticket-PDF program text is moving from an indirect "mark a campaign as the
-- source" mechanism to a directly editable field on the event itself, so an
-- admin can fix it any time without having to find and flag a campaign.
-- Shape: { de?: {title?, slots: ProgramSlot[]}, en?: {...}, fr?: {...} }
-- Left null by default — resolveTicketProgram() falls back to the existing
-- campaign-derived logic (is_pdf_source, then most recent) when unset.
alter table public.events
  add column if not exists ticket_program jsonb;
