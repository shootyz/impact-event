import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'
import type { Member } from './supabase'
import React from 'react'
import BlocksEmail from '@/app/admin/BlocksEmail'
import type { CampaignBlock } from '@/app/admin/campaign-renderer'
import type { Lang } from '@/app/admin/i18n'

// Dynamic require bypasses Turbopack's static analysis ban on react-dom/server in lib/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToStaticMarkup } = require('react-dom/server') as typeof import('react-dom/server')

function plainTextToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map(p => `<p style="color:#1E3263;font-size:15px;line-height:1.7;margin:0 0 20px;font-family:Arial,sans-serif;">${p.trim().replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

const getResend = () => new Resend(process.env.RESEND_API_KEY)

function buildCampaignHtml({
  appUrl,
  member,
  subject,
  headerImageUrl,
  bodyHtml,
  eventUrl,
  inviteCode,
  lang = 'en',
}: {
  appUrl: string
  member: Member
  subject: string
  headerImageUrl: string | null
  bodyHtml: string
  eventUrl: string | null
  inviteCode: string | null
  lang?: Lang
}) {
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${member.unsubscribe_token}`
  const fullBody = bodyHtml.trimStart().startsWith('<') ? bodyHtml : plainTextToHtml(bodyHtml)

  // Split body at <!-- CTA --> marker so invite code + button appear inline
  const CTA_MARKER = '<!-- CTA -->'
  const ctaIdx = fullBody.indexOf(CTA_MARKER)
  const bodyBefore = ctaIdx >= 0 ? fullBody.slice(0, ctaIdx) : fullBody
  const bodyAfter  = ctaIdx >= 0 ? fullBody.slice(ctaIdx + CTA_MARKER.length) : ''

  const langSuffix = lang !== 'en' ? `${(eventUrl ?? '').includes('?') ? '&' : '?'}lang=${lang}` : ''
  const eventIdMatch = eventUrl?.match(/[?&]event=([^&]+)/)
  const qrParams: string[] = []
  if (lang !== 'en') qrParams.push(`lang=${lang}`)
  if (eventIdMatch) qrParams.push(`event=${eventIdMatch[1]}`)
  const registerUrl = inviteCode
    ? `${appUrl}/api/quick-register/${encodeURIComponent(inviteCode)}${qrParams.length ? `?${qrParams.join('&')}` : ''}`
    : eventUrl ? `${eventUrl}${langSuffix}` : null

  const ctaBlock = registerUrl ? `
        <tr><td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td>
              <a href="${registerUrl}"
                style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:17px 32px;border-radius:14px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;font-family:Arial,sans-serif;">
                Register Now
              </a>
            </td></tr>
          </table>
        </td></tr>
` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#F8F9FF;font-family:Arial,sans-serif;min-height:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;padding:40px 16px 60px;min-height:100%;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #D0DDEA;">

        ${headerImageUrl ? `
        <tr><td style="padding:0;line-height:0;">
          <img src="${headerImageUrl}" alt="${subject}" width="560"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </td></tr>` : ''}

        <!-- Logo + greeting -->
        <tr><td style="padding:36px 40px 0;">
          <img src="${appUrl.replace(/\/$/, '')}/logo.png" alt="Impact Gstaad" height="48"
            style="display:block;margin-bottom:28px;" />
          <div style="height:1px;background:#e8e8e8;margin-bottom:28px;"></div>
          <p style="color:#1E3263;font-size:16px;font-weight:700;margin:0;font-family:Arial,sans-serif;">Dear ${member.first_name},</p>
        </td></tr>

        <!-- Body: intro (before CTA marker) -->
        ${bodyBefore ? `<tr><td style="padding:24px 40px 0;">${bodyBefore}</td></tr>` : ''}

        <!-- Invite code + Register button (only when CTA marker was in body) -->
        ${ctaIdx >= 0 ? ctaBlock : ''}

        <!-- Body: rest (after CTA marker) -->
        <tr><td style="padding:32px 40px 40px;">${bodyAfter || ''}</td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f5f5;border-top:1px solid #e8e8e8;padding:20px 40px 24px;border-radius:0 0 24px 24px;">
          <p style="color:#888888;font-size:11px;margin:0 0 8px;text-align:center;font-family:Arial,sans-serif;">
            Impact Gstaad &nbsp;·&nbsp;
            <a href="https://impactgstaad.ch" style="color:#1E3263;text-decoration:none;">impactgstaad.ch</a>
          </p>
          <p style="margin:0;text-align:center;">
            <a href="${unsubscribeUrl}" style="color:#888888;font-size:11px;text-decoration:underline;font-family:Arial,sans-serif;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function firstNameFromEmail(email: string): string {
  const local = email.split('@')[0]
  const first = local.split('.')[0]
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export function buildCampaignHtmlForTest({ appUrl, email, subject, bodyHtml, eventUrl }: {
  appUrl: string; email: string; subject: string; bodyHtml: string; eventUrl: string | null
}) {
  return buildCampaignHtml({
    appUrl,
    member: { id: 'test', first_name: firstNameFromEmail(email), last_name: '', email, unsubscribe_token: 'test', unsubscribed: false, created_at: '', zielgruppe_id: null },
    subject,
    headerImageUrl: null,
    bodyHtml,
    eventUrl,
    inviteCode: null,
  })
}

export async function sendCampaign({
  campaignId,
  subject,
  headerImageUrl,
  bodyHtml,
  blocksJson,
  eventUrl,
  appUrl,
  zielgruppeId,
  eventId,
}: {
  campaignId: string
  subject: string
  headerImageUrl: string | null
  bodyHtml: string
  blocksJson?: string | null
  eventUrl: string | null
  appUrl: string
  zielgruppeId?: string | null
  eventId?: string | null
}) {
  let hasRegisterBlock = false
  let campaignLang: Lang = 'en'
  let parsedBlocks: CampaignBlock[] | null = null
  const staticBodyHtml = (() => {
    if (!blocksJson) return bodyHtml
    try {
      const parsed = typeof blocksJson === 'string' ? JSON.parse(blocksJson) : blocksJson
      parsedBlocks = (Array.isArray(parsed) ? parsed : parsed.blocks ?? []) as CampaignBlock[]
      campaignLang = (!Array.isArray(parsed) && parsed.lang) ? parsed.lang : 'en'
      hasRegisterBlock = (parsedBlocks as CampaignBlock[]).some(b => b.type === 'register_button')
      // For hasRegisterBlock, we render per-member below; here render without registerUrl as fallback
      return renderToStaticMarkup(React.createElement(BlocksEmail, { blocks: parsedBlocks, lang: campaignLang, campaignId, appUrl }))
    } catch { return bodyHtml }
  })()

  const db = supabaseAdmin()

  let query = db.from('members').select('*').eq('unsubscribed', false)
  if (eventId) query = query.eq('event_id', eventId)
  if (zielgruppeId) query = query.eq('zielgruppe_id', zielgruppeId)
  const { data: members, error } = await query

  if (error || !members) throw new Error('Failed to load members')

  const { data: inviteCodes } = await db
    .from('invite_codes')
    .select('member_id, code')

  const codeMap = new Map<string, string>()
  if (inviteCodes) {
    for (const ic of inviteCodes) {
      if (!codeMap.has(ic.member_id)) codeMap.set(ic.member_id, ic.code)
    }
  }

  const resend = getResend()
  let sent = 0

  for (const member of members as Member[]) {
    const inviteCode = codeMap.get(member.id) ?? null

    // Compute per-member register URL
    const eventIdMatch = eventUrl?.match(/[?&]event=([^&]+)/)
    const qrParams: string[] = []
    if (campaignLang !== 'en') qrParams.push(`lang=${campaignLang}`)
    if (eventIdMatch) qrParams.push(`event=${eventIdMatch[1]}`)
    const memberRegisterUrl = inviteCode
      ? `${appUrl}/api/quick-register/${encodeURIComponent(inviteCode)}${qrParams.length ? `?${qrParams.join('&')}` : ''}`
      : eventUrl ?? null

    // When blocks contain a register_button, render per-member with personalized URL
    const finalBodyHtml = hasRegisterBlock && parsedBlocks
      ? renderToStaticMarkup(React.createElement(BlocksEmail, { blocks: parsedBlocks, lang: campaignLang, campaignId, appUrl, registerUrl: memberRegisterUrl ?? undefined }))
      : staticBodyHtml

    const html = buildCampaignHtml({
      appUrl,
      member,
      subject,
      headerImageUrl,
      bodyHtml: finalBodyHtml,
      eventUrl: hasRegisterBlock ? null : eventUrl,
      inviteCode: hasRegisterBlock ? null : inviteCode,
      lang: campaignLang,
    })

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: member.email,
        subject,
        html,
      })
      sent++
    } catch (e) {
      console.error(`Failed to send to ${member.email}:`, e)
    }
  }

  await db
    .from('campaigns')
    .update({ sent_at: new Date().toISOString(), recipient_count: sent })
    .eq('id', campaignId)

  // Log recipients
  const recipientRows = (members as Member[]).filter(m => {
    // only those we actually tried to send to (all non-unsubscribed in scope)
    return !m.unsubscribed && (!zielgruppeId || m.zielgruppe_id === zielgruppeId)
  }).map(m => ({
    campaign_id: campaignId,
    email: m.email,
    first_name: m.first_name,
    last_name: m.last_name,
  }))
  if (recipientRows.length > 0) {
    await db.from('campaign_recipients').insert(recipientRows)
  }

  return { sent }
}
