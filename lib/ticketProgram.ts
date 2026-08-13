import { SupabaseClient } from '@supabase/supabase-js'
import type { ProgramSlot } from '@/app/admin/campaign-renderer'

export type { ProgramSlot }
export type TicketProgram = { title?: string; slots: ProgramSlot[] }
export type Lang = 'de' | 'en' | 'fr'

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

  const { data: eventCampaigns } = await db
    .from('campaigns')
    .select('blocks_json, sent_at, created_at')
    .eq('event_id', eventId)

  const candidates = (eventCampaigns ?? [])
    .map((c) => {
      let parsed: { lang?: string; blocks?: { type: string; title?: string; slots?: ProgramSlot[] }[] } | null = null
      try { parsed = typeof c.blocks_json === 'string' ? JSON.parse(c.blocks_json) : c.blocks_json } catch { /* ignore malformed */ }
      return { ...c, parsed }
    })
    .filter((c) => c.parsed && !Array.isArray(c.parsed) && c.parsed.lang === lang)
    .sort((a, b) => {
      if (a.sent_at && !b.sent_at) return -1
      if (!a.sent_at && b.sent_at) return 1
      const aTime = new Date(a.sent_at ?? a.created_at).getTime()
      const bTime = new Date(b.sent_at ?? b.created_at).getTime()
      return bTime - aTime
    })

  const programBlock = candidates[0]?.parsed?.blocks?.find((b) => b.type === 'program')
  if (!programBlock) return null
  return { title: programBlock.title, slots: programBlock.slots ?? [] }
}
