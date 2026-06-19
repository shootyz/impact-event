import { NextRequest, NextResponse } from 'next/server'
import { buildCampaignHtmlForTest } from '@/lib/campaign-email'
import { renderBlocksToHtml } from '@/app/admin/CampaignBuilder'
import type { CampaignBlock } from '@/app/admin/CampaignBuilder'

export async function POST(req: NextRequest) {
  const { subject, body_html, event_url, blocks_json } = await req.json()
  if (!body_html && !blocks_json) return NextResponse.json({ error: 'body_html required' }, { status: 400 })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  let bodyHtml = body_html || ''
  if (blocks_json) {
    try {
      const parsed = typeof blocks_json === 'string' ? JSON.parse(blocks_json) : blocks_json
      const blocks: CampaignBlock[] = (Array.isArray(parsed) ? parsed : parsed.blocks ?? []) as CampaignBlock[]
      const lang = !Array.isArray(parsed) ? parsed.lang : undefined
      const rendered = renderBlocksToHtml(blocks, { appUrl, lang })
      if (rendered.trim()) bodyHtml = rendered
    } catch { /* fall back to body_html */ }
  }

  const html = buildCampaignHtmlForTest({
    appUrl,
    email: '[Name]@impactgstaad.ch',
    subject: subject || 'Vorschau',
    bodyHtml,
    eventUrl: event_url || null,
  })
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
