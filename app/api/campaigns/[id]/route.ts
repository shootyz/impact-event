import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCampaign } from '@/lib/campaign-email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseAdmin()
  const { data: campaign, error } = await db
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.sent_at) return NextResponse.json({ error: 'Already sent' }, { status: 409 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  try {
    const result = await sendCampaign({
      campaignId: campaign.id,
      subject: campaign.subject,
      headerImageUrl: campaign.header_image_url,
      bodyHtml: campaign.body_html,
      eventUrl: campaign.event_url,
      appUrl,
    })
    return NextResponse.json({ sent: result.sent })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseAdmin()
  const { error } = await db.from('campaigns').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
