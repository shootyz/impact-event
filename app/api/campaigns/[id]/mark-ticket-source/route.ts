import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Marks (or unmarks) this campaign as the source of the "Zeitplan" (program) block
// shown on the ticket PDF for its event_id + language — independent of sent/draft
// status, since a sent campaign can never be edited again. Exactly one campaign per
// (event_id, lang) should hold this flag; setting it here clears it from any sibling
// campaign of the same event and language.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json().catch(() => ({}))
  const _a = checkAdminAuth(req, body ?? {})
  if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })

  const db = supabaseAdmin()

  if (body?.unset) {
    const { error } = await db.from('campaigns').update({ is_pdf_source: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, is_pdf_source: false })
  }

  const { data: campaign, error } = await db.from('campaigns').select('id, event_id, blocks_json').eq('id', id).single()
  if (error || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (!campaign.event_id) return NextResponse.json({ error: 'Kampagne hat kein verknüpftes Event.' }, { status: 400 })

  const bj = campaign.blocks_json as { lang?: string } | null
  const lang = (bj && !Array.isArray(bj) ? bj.lang : null) ?? 'en'

  const { data: siblings } = await db.from('campaigns').select('id, blocks_json').eq('event_id', campaign.event_id)
  const sameLangIds = (siblings ?? [])
    .filter(s => {
      if (s.id === id) return false
      const sbj = s.blocks_json as { lang?: string } | null
      return ((sbj && !Array.isArray(sbj) ? sbj.lang : null) ?? 'en') === lang
    })
    .map(s => s.id)

  if (sameLangIds.length > 0) {
    await db.from('campaigns').update({ is_pdf_source: false }).in('id', sameLangIds)
  }

  const { error: setError } = await db.from('campaigns').update({ is_pdf_source: true }).eq('id', id)
  if (setError) return NextResponse.json({ error: setError.message }, { status: 500 })

  return NextResponse.json({ ok: true, is_pdf_source: true, lang })
}
