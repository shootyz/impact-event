import { SupabaseClient } from '@supabase/supabase-js'
import type { ProgramSlot } from '@/app/admin/campaign-renderer'

export type { ProgramSlot }
export type TicketProgram = { title?: string; slots: ProgramSlot[] }
export type Lang = 'de' | 'en' | 'fr'

type ParsedCampaign = {
  sent_at: string | null
  created_at: string
  parsed: { lang?: string; blocks?: { type: string; title?: string; slots?: ProgramSlot[] }[] } | null
}

async function campaignsForLang(db: SupabaseClient, eventId: string, lang: Lang): Promise<ParsedCampaign[]> {
  const { data: eventCampaigns } = await db
    .from('campaigns')
    .select('blocks_json, sent_at, created_at')
    .eq('event_id', eventId)

  return (eventCampaigns ?? [])
    .map((c: { blocks_json: unknown; sent_at: string | null; created_at: string }) => {
      let parsed: ParsedCampaign['parsed'] = null
      try { parsed = typeof c.blocks_json === 'string' ? JSON.parse(c.blocks_json) : (c.blocks_json as ParsedCampaign['parsed']) } catch { /* ignore malformed */ }
      return { sent_at: c.sent_at, created_at: c.created_at, parsed }
    })
    .filter((c: ParsedCampaign) => c.parsed && !Array.isArray(c.parsed) && c.parsed.lang === lang)
}

function programBlockOf(c: ParsedCampaign | undefined): TicketProgram | null {
  const programBlock = c?.parsed?.blocks?.find((b) => b.type === 'program')
  if (!programBlock) return null
  return { title: programBlock.title, slots: programBlock.slots ?? [] }
}

// The ticket PDF's schedule used to be pulled from whichever campaign was
// most recently sent/drafted — because a sent campaign can never be edited
// again, that was the only way to fix a schedule mistake after sending.
// events.ticket_program is now the direct, always-editable source; this only
// falls back to the campaign-derived lookup for events that haven't used the
// new editor yet.
export async function resolveTicketProgram(
  db: SupabaseClient,
  eventId: string,
  lang: Lang
): Promise<TicketProgram | null> {
  const { data: event } = await db.from('events').select('ticket_program').eq('id', eventId).single()
  const stored = (event?.ticket_program as Record<string, TicketProgram> | null)?.[lang]
  if (stored?.slots?.length) return stored

  const candidates = (await campaignsForLang(db, eventId, lang)).sort((a, b) => {
    if (a.sent_at && !b.sent_at) return -1
    if (!a.sent_at && b.sent_at) return 1
    const aTime = new Date(a.sent_at ?? a.created_at).getTime()
    const bTime = new Date(b.sent_at ?? b.created_at).getTime()
    return bTime - aTime
  })

  return programBlockOf(candidates[0])
}

// For the editor's "Text der neuesten Kampagne übernehmen" button — an
// explicit re-pull that ignores both the saved override and the sent-first
// priority above, always taking the most recently created campaign
// (draft or sent) regardless.
export async function getLatestCampaignProgram(
  db: SupabaseClient,
  eventId: string,
  lang: Lang
): Promise<TicketProgram | null> {
  const candidates = (await campaignsForLang(db, eventId, lang))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return programBlockOf(candidates[0])
}
