import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildCampaignHtmlForMember } from '@/lib/campaign-email'
import { APP_URL } from '@/lib/app-url'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const { id } = await props.params
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return new NextResponse('Missing token', { status: 400 })

  const db = supabaseAdmin()
  const appUrl = APP_URL

  const [{ data: campaign }, { data: member }] = await Promise.all([
    db.from('campaigns').select('*').eq('id', id).single(),
    db.from('members').select('*').eq('unsubscribe_token', token).single(),
  ])

  if (!campaign || !member) return new NextResponse('Not found', { status: 404 })

  const { data: inviteCode } = await db
    .from('invite_codes')
    .select('code')
    .eq('member_id', member.id)
    .maybeSingle()

  const html = await buildCampaignHtmlForMember({
    campaign,
    member,
    appUrl,
    inviteCode: inviteCode?.code ?? null,
  })

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
