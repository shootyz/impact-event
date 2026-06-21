import { NextRequest, NextResponse } from 'next/server'
import { buildCampaignHtmlForMember } from '@/lib/campaign-email'
import { supabaseAdmin } from '@/lib/supabase'
import type { Member } from '@/lib/supabase'

const getResend = () => {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { campaign_id, recipients, adminPassword } = body
  if (adminPassword !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients' }, { status: 400 })
  }

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data: campaign } = await db.from('campaigns').select('*').eq('id', campaign_id).single()
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL || 'events@impactgstaad.ch'

  const errors: string[] = []
  for (const email of recipients) {
    const local = email.split('@')[0]
    const firstName = local.split('.')[0]
    const first_name = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    const fakeMember: Member = {
      id: 'test', first_name, last_name: '', email,
      unsubscribe_token: 'test', unsubscribed: false, created_at: '', zielgruppe_id: null,
    }
    const html = await buildCampaignHtmlForMember({ campaign, member: fakeMember, appUrl, inviteCode: null })
    try {
      await resend.emails.send({ from, to: email, subject: `[TEST] ${campaign.subject}`, html })
    } catch {
      errors.push(email)
    }
  }

  if (errors.length > 0) return NextResponse.json({ error: `Fehler bei: ${errors.join(', ')}` }, { status: 500 })
  return NextResponse.json({ ok: true, sent: recipients.length })
}
