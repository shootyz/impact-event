import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCampaign } from '@/lib/campaign-email'

function checkAuth(req: NextRequest, body?: Record<string, unknown>): boolean {
  const pw = process.env.ADMIN_PASSWORD
  const fromQuery = req.nextUrl.searchParams.get('adminPassword')
  const fromBody = body?.adminPassword as string | undefined
  return (fromQuery ?? fromBody) === pw
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const { id } = await props.params
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  const { data, error } = await db.from('campaigns').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json()
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  const { data: campaign, error } = await db
    .from('campaigns')
    .select('*')
    .eq('id', id)
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
      blocksJson: campaign.blocks_json,
      eventUrl: campaign.event_url,
      appUrl,
      zielgruppeId: campaign.zielgruppe_id ?? null,
      eventId: campaign.event_id ?? null,
    })
    return NextResponse.json({ sent: result.sent })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json()
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  const allowed = ['scheduled_at', 'subject', 'body_html', 'event_url', 'header_image_url', 'blocks_json', 'zielgruppe_id', 'lang_group_id']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) if (key in body) patch[key] = body[key]
  const { data, error } = await db
    .from('campaigns')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json().catch(() => ({}))
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  const { error } = await db.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
