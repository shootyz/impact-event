import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { buildCampaignHtmlForMember } from '@/lib/campaign-email'
import { supabaseAdmin } from '@/lib/supabase'
import type { Member } from '@/lib/supabase'

const getResend = () => {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function insertTestNoteBanner(html: string, note: string): string {
  const banner = `<table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7;border-bottom:2px solid #F59E0B;"><tr><td align="center" style="padding:14px 16px;"><p style="margin:0;color:#78350F;font-size:13px;font-family:Arial,sans-serif;line-height:1.5;"><strong>Notiz zum Entwurf:</strong> ${escHtml(note)}</p></td></tr></table>`
  const bodyOpenTag = html.match(/<body[^>]*>/i)
  if (!bodyOpenTag) return banner + html
  return html.replace(bodyOpenTag[0], `${bodyOpenTag[0]}${banner}`)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { campaign_id, recipients, adminPassword, note } = body
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: auth === 'rate_limited' ? 429 : 401 })

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
      unsubscribe_token: 'test', unsubscribed: false, created_at: '', zielgruppe_ids: [],
    }
    let html = await buildCampaignHtmlForMember({ campaign, member: fakeMember, appUrl, inviteCode: null })
    if (typeof note === 'string' && note.trim()) html = insertTestNoteBanner(html, note.trim())
    try {
      await resend.emails.send({ from, to: email, subject: `[TEST] ${campaign.subject}`, html })
    } catch {
      errors.push(email)
    }
  }

  if (errors.length > 0) return NextResponse.json({ error: `Fehler bei: ${errors.join(', ')}` }, { status: 500 })
  return NextResponse.json({ ok: true, sent: recipients.length })
}
