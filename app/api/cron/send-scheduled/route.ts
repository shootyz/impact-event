import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCampaign } from '@/lib/campaign-email'

export async function GET() {
  const db = supabaseAdmin()

  const { data: campaigns, error } = await db
    .from('campaigns')
    .select('*')
    .not('scheduled_at', 'is', null)
    .is('sent_at', null)
    .lte('scheduled_at', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!campaigns || campaigns.length === 0) return NextResponse.json({ sent: 0 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  let totalSent = 0

  for (const campaign of campaigns) {
    try {
      const result = await sendCampaign({
        campaignId: campaign.id,
        subject: campaign.subject,
        headerImageUrl: campaign.header_image_url,
        bodyHtml: campaign.body_html,
        eventUrl: campaign.event_url,
        appUrl,
      })
      totalSent += result.sent
    } catch (e) {
      console.error(`Failed to send campaign ${campaign.id}:`, e)
    }
  }

  return NextResponse.json({ sent: totalSent, campaigns: campaigns.length })
}
