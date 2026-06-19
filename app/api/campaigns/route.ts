import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCampaign } from '@/lib/campaign-email'

export async function GET(req: NextRequest) {
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
  const { subject, header_image_url, body_html, event_url, send_now, blocks_json, zielgruppe_id, event_id } = await req.json()

  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!subject?.trim() || !body_html?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: campaign, error } = await db
    .from('campaigns')
    .insert({ subject, header_image_url: header_image_url || null, body_html, event_url: event_url || null, blocks_json: blocks_json ?? null, zielgruppe_id: zielgruppe_id ?? null, event_id })
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
        bodyHtml: body_html,
        blocksJson: blocks_json ?? null,
        eventUrl: event_url || null,
        appUrl,
        eventId: event_id,
      })
      return NextResponse.json({ campaign, sent: result.sent })
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Send failed', campaign }, { status: 500 })
    }
  }

  return NextResponse.json({ campaign })
}
