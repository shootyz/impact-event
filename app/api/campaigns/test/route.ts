import { NextRequest, NextResponse } from 'next/server'
import { buildCampaignHtmlForTest } from '@/lib/campaign-email'
import { renderBlocksToHtml } from '@/app/admin/campaign-renderer'
import type { CampaignBlock } from '@/app/admin/campaign-renderer'
import type { Lang } from '@/app/admin/i18n'
import { supabaseAdmin } from '@/lib/supabase'

const getResend = () => {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  const { campaign_id, subject: subjectIn, body_html: bodyHtmlIn, event_url: eventUrlIn, recipients } = await req.json()

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients' }, { status: 400 })
  }

  let subject = subjectIn
  let body_html = bodyHtmlIn
  let event_url = eventUrlIn

  // If campaign_id provided, fetch fresh data from DB (handles stale client state after duplication)
  if (campaign_id) {
    const { data: campaign } = await supabaseAdmin()
      .from('campaigns')
      .select('subject, body_html, event_url, blocks_json')
      .eq('id', campaign_id)
      .single()
    if (campaign) {
      subject = campaign.subject
      event_url = campaign.event_url
      // Re-render from blocks_json if available (always fresh)
      if (campaign.blocks_json) {
        try {
          const parsed = campaign.blocks_json as { lang?: Lang; blocks?: CampaignBlock[] } | CampaignBlock[]
          const blocks: CampaignBlock[] = Array.isArray(parsed) ? parsed : parsed.blocks ?? []
          const lang: Lang = Array.isArray(parsed) ? 'en' : (parsed.lang ?? 'en')
          const rendered = renderBlocksToHtml(blocks, { lang })
          if (rendered.trim()) body_html = rendered
          else body_html = campaign.body_html
        } catch { body_html = campaign.body_html }
      } else {
        body_html = campaign.body_html
      }
    }
  }

  if (!subject?.trim() || !body_html?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL || 'events@impactgstaad.ch'

  const errors: string[] = []
  for (const email of recipients) {
    const html = buildCampaignHtmlForTest({ appUrl, email, subject, bodyHtml: body_html, eventUrl: event_url || null })
    try {
      await resend.emails.send({ from, to: email, subject: `[TEST] ${subject}`, html })
    } catch (e) {
      errors.push(email)
    }
  }

  if (errors.length > 0) return NextResponse.json({ error: `Fehler bei: ${errors.join(', ')}` }, { status: 500 })
  return NextResponse.json({ ok: true, sent: recipients.length })
}
