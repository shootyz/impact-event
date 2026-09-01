import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export type CampaignStats = {
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  topLinks: { link: string; count: number }[]
}

// Aggregates campaign_events for a campaign. Counts distinct email addresses
// per type rather than raw row counts — a single recipient can generate
// several open/click rows (repeat opens, Apple's Mail Privacy Protection
// pre-fetching, multiple link clicks), which would otherwise inflate counts.
export async function computeCampaignStats(campaignId: string): Promise<CampaignStats> {
  const db = supabaseAdmin()
  const { data: events } = await db
    .from('campaign_events')
    .select('type, email, link')
    .eq('campaign_id', campaignId)

  const byType = (type: string) => new Set(
    (events ?? []).filter(e => e.type === type && e.email).map(e => e.email as string)
  ).size

  const linkCounts = new Map<string, Set<string>>()
  for (const e of events ?? []) {
    if (e.type !== 'click' || !e.link || !e.email) continue
    if (!linkCounts.has(e.link)) linkCounts.set(e.link, new Set())
    linkCounts.get(e.link)!.add(e.email)
  }
  const topLinks = [...linkCounts.entries()]
    .map(([link, emails]) => ({ link, count: emails.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    delivered: byType('delivered'),
    opened: byType('open'),
    clicked: byType('click'),
    bounced: byType('bounced'),
    complained: byType('complained'),
    failed: byType('failed'),
    topLinks,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id } = await props.params
  const stats = await computeCampaignStats(id)
  return NextResponse.json(stats)
}
