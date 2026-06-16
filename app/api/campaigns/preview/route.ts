import { NextRequest, NextResponse } from 'next/server'
import { buildCampaignHtmlForTest } from '@/lib/campaign-email'

export async function POST(req: NextRequest) {
  const { subject, body_html, event_url } = await req.json()
  if (!body_html) return NextResponse.json({ error: 'body_html required' }, { status: 400 })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const html = buildCampaignHtmlForTest({
    appUrl,
    email: '[Name]@impactgstaad.ch',
    subject: subject || 'Vorschau',
    bodyHtml: body_html,
    eventUrl: event_url || null,
  })
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
