import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type BrevoEvent = {
  event: string
  email: string
  'message-id'?: string
  tags?: string[]
  link?: string
}

// Brevo doesn't sign webhook payloads (no HMAC like Resend/Svix) — the bearer
// token below is the only authenticity check, set when the webhook is created
// via POST /v3/webhooks with `auth: {type: "bearer", token: "..."}`.
const EVENT_TYPE_MAP: Record<string, 'delivered' | 'open' | 'click' | 'bounced' | 'complained' | 'failed'> = {
  delivered: 'delivered',
  opened: 'open',
  unique_opened: 'open',
  clicked: 'click',
  hard_bounce: 'bounced',
  spam: 'complained',
  blocked: 'failed',
  invalid_email: 'failed',
  error: 'failed',
}

function tagValue(tags: string[] | undefined, prefix: string): string | null {
  const tag = tags?.find(t => t.startsWith(prefix))
  return tag ? tag.slice(prefix.length) : null
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.BREVO_WEBHOOK_SECRET || auth !== `Bearer ${process.env.BREVO_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json().catch(() => null) as BrevoEvent | null
  if (!payload?.event || !payload.email) return NextResponse.json({ ok: true })

  const db = supabaseAdmin()

  if (payload.event === 'unsubscribed') {
    await db.from('members').update({ unsubscribed: true }).eq('email', payload.email)
    return NextResponse.json({ ok: true })
  }

  const type = EVENT_TYPE_MAP[payload.event]
  if (!type) return NextResponse.json({ ok: true }) // sent/deferred/soft_bounce — transient, not tracked

  // tags are set at send time as [`c:<campaignId>`, `m:<memberId>`] (see
  // lib/campaign-email.ts) — untagged sends (e.g. ticket confirmations from
  // lib/email.ts) aren't campaign events, so there's nothing to log here.
  const campaignId = tagValue(payload.tags, 'c:')
  if (!campaignId) return NextResponse.json({ ok: true })
  const memberTag = tagValue(payload.tags, 'm:')
  const memberId = memberTag && memberTag !== 'test' ? memberTag : null

  const { error } = await db.from('campaign_events').insert({
    campaign_id: campaignId,
    member_id: memberId,
    email: payload.email,
    type,
    link: payload.link ?? null,
    email_id: payload['message-id'] ?? null,
  })
  if (error && error.code !== '23505') console.error('Brevo webhook insert failed:', error)

  if (memberId && (type === 'bounced' || type === 'complained' || type === 'failed')) {
    await db.from('members').update({ email_status: type, email_status_at: new Date().toISOString() }).eq('id', memberId)
  }

  return NextResponse.json({ ok: true })
}
