import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { computeCampaignStats } from '../stats/route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, props: any) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id } = await props.params
  const db = supabaseAdmin()
  const { data: campaign } = await db.from('campaigns').select('subject, recipient_count, sent_at').eq('id', id).single()
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const stats = await computeCampaignStats(id)
  const sentDate = campaign.sent_at ? new Date(campaign.sent_at).toLocaleString('de-CH') : '—'

  const topLinksHtml = stats.topLinks.length
    ? `<ul>${stats.topLinks.map(l => `<li>${l.count}× — ${l.link}</li>`).join('')}</ul>`
    : '<p>Keine Klicks erfasst.</p>'

  const html = `
    <h2>Kampagnen-Bericht: ${campaign.subject}</h2>
    <p>Gesendet am ${sentDate} an ${campaign.recipient_count ?? '?'} Empfänger.</p>
    <ul>
      <li>Zugestellt: ${stats.delivered}</li>
      <li>Geöffnet: ${stats.opened}</li>
      <li>Geklickt: ${stats.clicked}</li>
      <li>Bounced: ${stats.bounced}</li>
      <li>Beschwerden: ${stats.complained}</li>
      <li>Fehlgeschlagen: ${stats.failed}</li>
    </ul>
    <h3>Top-Links</h3>
    ${topLinksHtml}
  `

  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'info@impactgstaad.ch',
    subject: `Kampagnen-Bericht: ${campaign.subject}`,
    html,
  })

  return NextResponse.json({ ok: true })
}
