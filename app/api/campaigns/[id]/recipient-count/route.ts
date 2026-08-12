import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Mirrors the targeting logic in lib/campaign-email.ts's sendCampaign() — same
// event_id/zielgruppe_id/unsubscribed/sprache filters — but read-only, so a draft's
// "would send to N people" count can be shown before it's actually sent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id } = await props.params
  const db = supabaseAdmin()
  const { data: campaign, error } = await db
    .from('campaigns')
    .select('event_id, zielgruppe_id, blocks_json')
    .eq('id', id)
    .single()
  if (error || !campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const bj = campaign.blocks_json as { lang?: string } | null
  const lang = ((bj && !Array.isArray(bj) ? bj.lang : null) ?? 'en').toLowerCase()

  let query = db.from('members').select('sprache').eq('unsubscribed', false)
  if (campaign.event_id) query = query.eq('event_id', campaign.event_id)
  if (campaign.zielgruppe_id) {
    const { data: memberLinks } = await db.from('member_zielgruppen').select('member_id').eq('zielgruppe_id', campaign.zielgruppe_id)
    const memberIds = (memberLinks ?? []).map(l => l.member_id)
    query = query.in('id', memberIds.length ? memberIds : ['00000000-0000-0000-0000-000000000000'])
  }
  const { data: members, error: membersError } = await query
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

  const count = (members ?? []).filter(m => (m.sprache || 'de').toLowerCase() === lang).length
  return NextResponse.json({ count, lang })
}
