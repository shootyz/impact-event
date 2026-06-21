import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCampaign } from '@/lib/campaign-email'

function checkAuth(req: NextRequest, body?: Record<string, unknown>): boolean {
  const pw = process.env.ADMIN_PASSWORD
  const fromQuery = req.nextUrl.searchParams.get('adminPassword')
  const fromBody = body?.adminPassword as string | undefined
  return (fromQuery ?? fromBody) === pw
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('campaigns')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, header_image_url, body_html, event_url, send_now, blocks_json, zielgruppe_id, event_id, lang_group_id } = body

  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  // Allow blocks_json-only campaigns (body_html can be empty string)
  if (!blocks_json && !body_html?.trim()) {
    return NextResponse.json({ error: 'Either blocks_json or body_html is required' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: campaign, error } = await db
    .from('campaigns')
    .insert({ subject, header_image_url: header_image_url || null, body_html: body_html || '', event_url: event_url || null, blocks_json: blocks_json ?? null, zielgruppe_id: zielgruppe_id ?? null, event_id, lang_group_id: lang_group_id ?? null })
    .select()
    .single()

  if (error || !campaign) return NextResponse.json({ error: error?.message }, { status: 500 })

  if (send_now) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    try {
      const result = await sendCampaign({
        campaignId: campaign.id,
        subject,
        headerImageUrl: header_image_url || null,
        bodyHtml: body_html || '',
        blocksJson: blocks_json ?? null,
        eventUrl: event_url || null,
        appUrl,
        eventId: event_id,
      })
      return NextResponse.json({ campaign, sent: result.sent })
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Send failed', detail: String(e), campaign }, { status: 500 })
    }
  }

  return NextResponse.json({ campaign })
}
