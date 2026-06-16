import { NextRequest, NextResponse } from 'next/server'
import { buildCampaignHtmlForTest } from '@/lib/campaign-email'

const getResend = () => {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  const { subject, body_html, event_url, recipients } = await req.json()

  if (!subject?.trim() || !body_html?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients' }, { status: 400 })
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
