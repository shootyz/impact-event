import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'
import type { Member } from './supabase'

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
}: {
  appUrl: string
  member: Member
  subject: string
  headerImageUrl: string | null
  bodyHtml: string
  eventUrl: string | null
  inviteCode: string | null
}) {
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${member.unsubscribe_token}`
  const body = bodyHtml.trimStart().startsWith('<') ? bodyHtml : plainTextToHtml(bodyHtml)

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#F8F9FF;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;padding:40px 16px 60px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #D0DDEA;overflow:hidden;">

        ${headerImageUrl ? `
        <tr><td style="padding:0;line-height:0;">
          <img src="${headerImageUrl}" alt="${subject}" width="560"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </td></tr>` : ''}

        <!-- Logo + Begrüssung -->
        <tr><td style="padding:36px 40px 0;">
          <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="28"
            style="display:block;margin-bottom:28px;" />
          <div style="height:1px;background:#D0DDEA;margin-bottom:28px;"></div>
          <p style="color:#1E3263;font-size:16px;font-weight:700;margin:0;font-family:Arial,sans-serif;">Sehr geehrte/r ${member.first_name} ${member.last_name},</p>
        </td></tr>

        ${inviteCode ? `
        <tr><td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#F8F9FF;border-radius:16px;border:1.5px solid #D0DDEA;padding:20px 24px;">
              <p style="color:#A7C4DE;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 10px;font-family:Arial,sans-serif;">Ihr persönlicher Einladungscode</p>
              <p style="color:#1E3263;font-size:28px;font-weight:700;letter-spacing:8px;margin:0;font-family:Arial,sans-serif;">${inviteCode}</p>
            </td></tr>
          </table>
        </td></tr>` : ''}

        ${eventUrl ? `
        <tr><td style="padding:16px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td>
              <a href="${eventUrl}"
                style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:17px 32px;border-radius:14px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;font-family:Arial,sans-serif;">
                Jetzt anmelden
              </a>
            </td></tr>
          </table>
        </td></tr>` : ''}

        <!-- Goldene Trennlinie -->
        <tr><td style="padding:32px 40px 0;">
          <div style="height:2px;background:#D28D28;"></div>
        </td></tr>

        <!-- Inhalt -->
        <tr><td style="padding:32px 40px 40px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8F9FF;border-top:1px solid #D0DDEA;padding:20px 40px 24px;">
          <p style="color:#A7C4DE;font-size:11px;margin:0 0 8px;text-align:center;font-family:Arial,sans-serif;">
            Impact Gstaad &nbsp;·&nbsp;
            <a href="https://impactgstaad.ch" style="color:#1E3263;text-decoration:none;">impactgstaad.ch</a>
          </p>
          <p style="margin:0;text-align:center;">
            <a href="${unsubscribeUrl}" style="color:#A7C4DE;font-size:11px;text-decoration:underline;font-family:Arial,sans-serif;">Abmelden</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendCampaign({
  campaignId,
  subject,
  headerImageUrl,
  bodyHtml,
  eventUrl,
  appUrl,
}: {
  campaignId: string
  subject: string
  headerImageUrl: string | null
  bodyHtml: string
  eventUrl: string | null
  appUrl: string
}) {
  const db = supabaseAdmin()

  const { data: members, error } = await db
    .from('members')
    .select('*')
    .eq('unsubscribed', false)

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
    const html = buildCampaignHtml({
      appUrl,
      member,
      subject,
      headerImageUrl,
      bodyHtml,
      eventUrl,
      inviteCode,
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

  return { sent }
}
