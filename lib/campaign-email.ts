import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'
import type { Member } from './supabase'

function plainTextToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map(p => `<p style="color:#1E3263;font-size:15px;line-height:1.7;margin:0 0 16px;">${p.trim().replace(/\n/g, '<br/>')}</p>`)
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

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F9FF;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;padding:24px 16px 48px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #D0DDEA;overflow:hidden;">

        ${headerImageUrl ? `
        <tr>
          <td style="padding:0;">
            <img src="${headerImageUrl}" alt="${subject}" width="560" style="display:block;width:100%;max-width:560px;border-radius:20px 20px 0 0;" />
          </td>
        </tr>` : ''}

        <tr>
          <td style="padding:32px 32px 0;">
            <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="28" style="display:block;margin-bottom:24px;" />
            <p style="color:#1E3263;font-size:15px;font-weight:600;margin:0 0 6px;">Dear ${member.first_name} ${member.last_name},</p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 0;">
            ${bodyHtml.trimStart().startsWith('<') ? bodyHtml : plainTextToHtml(bodyHtml)}
          </td>
        </tr>

        ${inviteCode ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;border-radius:12px;border:1px solid #D0DDEA;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#A7C4DE;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Your personal invite code</p>
                  <p style="color:#1E3263;font-size:22px;font-weight:700;letter-spacing:4px;margin:0;">${inviteCode}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}

        ${eventUrl ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <a href="${eventUrl}"
               style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">
              REGISTER NOW
            </a>
          </td>
        </tr>` : ''}

        <tr>
          <td style="padding:32px 32px 24px;">
            <div style="height:1px;background:#D0DDEA;margin-bottom:20px;"></div>
            <p style="color:#A7C4DE;font-size:12px;margin:0;text-align:center;">
              Impact Gstaad · <a href="https://impactgstaad.ch" style="color:#1E3263;text-decoration:none;">impactgstaad.ch</a>
            </p>
            <p style="color:#A7C4DE;font-size:11px;margin:8px 0 0;text-align:center;">
              <a href="${unsubscribeUrl}" style="color:#A7C4DE;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

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

  // Load active members
  const { data: members, error } = await db
    .from('members')
    .select('*')
    .eq('unsubscribed', false)

  if (error || !members) throw new Error('Failed to load members')

  // Load invite codes for this campaign's event (if event URL points to our app)
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

  // Mark campaign as sent
  await db
    .from('campaigns')
    .update({ sent_at: new Date().toISOString(), recipient_count: sent })
    .eq('id', campaignId)

  return { sent }
}
