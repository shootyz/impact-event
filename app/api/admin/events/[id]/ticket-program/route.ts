import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTicketProgram, type Lang, type TicketProgram } from '@/lib/ticketProgram'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const { id } = await props.params
  const _a = checkAdminAuth(req)
  if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })

  const langParam = req.nextUrl.searchParams.get('lang')
  const lang: Lang = langParam === 'en' || langParam === 'fr' ? langParam : 'de'

  const db = supabaseAdmin()
  const program = await resolveTicketProgram(db, id, lang)
  return NextResponse.json({ lang, title: program?.title ?? '', slots: program?.slots ?? [] })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json().catch(() => ({}))
  const _a = checkAdminAuth(req, body ?? {})
  if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })

  const lang: Lang = body?.lang === 'en' || body?.lang === 'fr' ? body.lang : 'de'
  const title: string = typeof body?.title === 'string' ? body.title : ''
  const slots = Array.isArray(body?.slots) ? body.slots : []

  const db = supabaseAdmin()
  const { data: event, error: fetchError } = await db.from('events').select('ticket_program').eq('id', id).single()
  if (fetchError || !event) return NextResponse.json({ error: 'Event nicht gefunden.' }, { status: 404 })

  const current = (event.ticket_program as Record<Lang, TicketProgram> | null) ?? {}
  const updated = { ...current, [lang]: { title, slots } }

  const { error } = await db.from('events').update({ ticket_program: updated }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // This is the single source of truth for the schedule now — push it into
  // every still-editable (unsent) campaign draft in this language, so an
  // admin doesn't have to separately update each one's own Zeitplan block.
  // Sent campaigns are untouched (already delivered, can't be edited).
  const { data: drafts } = await db
    .from('campaigns')
    .select('id, blocks_json')
    .eq('event_id', id)
    .is('sent_at', null)

  const syncedIds: string[] = []
  for (const draft of drafts ?? []) {
    let parsed: { lang?: string; blocks?: { type: string; title?: string; slots?: unknown }[] } | null = null
    try { parsed = typeof draft.blocks_json === 'string' ? JSON.parse(draft.blocks_json) : draft.blocks_json } catch { continue }
    if (!parsed || Array.isArray(parsed) || parsed.lang !== lang || !parsed.blocks) continue

    const programBlock = parsed.blocks.find((b) => b.type === 'program')
    if (!programBlock) continue // don't inject a new block into a draft that never had one

    programBlock.title = title
    programBlock.slots = slots
    const { error: draftError } = await db.from('campaigns').update({ blocks_json: parsed }).eq('id', draft.id)
    if (!draftError) syncedIds.push(draft.id)
  }

  return NextResponse.json({ ok: true, lang, title, slots, syncedDrafts: syncedIds.length })
}
