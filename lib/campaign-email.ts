import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'
import type { Member } from './supabase'

function plainTextToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map(p => `<p style="color:#1E3263;font-size:15px;line-height:1.75;margin:0 0 16px;">${p.trim().replace(/\n/g, '<br/>')}</p>`)
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#EEF2F8;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F8;padding:32px 16px 56px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        ${headerImageUrl ? `
        <!-- Header image — full bleed, rounded top -->
        <tr>
          <td style="padding:0;">
            <img src="${headerImageUrl}" alt="${subject}" width="580"
              style="display:block;width:100%;max-width:580px;border-radius:20px 20px 0 0;border:0;" />
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-left:1px solid #D8E4EF;border-right:1px solid #D8E4EF;padding:32px 40px 0;">` : `
        <tr>
          <td style="background:#ffffff;border:1px solid #D8E4EF;border-radius:20px 20px 0 0;padding:32px 40px 0;">`}

            <!-- Logo -->
            <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="30"
              style="display:block;margin-bottom:28px;" />

            <!-- Greeting -->
            <p style="color:#1E3263;font-size:17px;font-weight:700;margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;">Dear ${member.first_name} ${member.last_name},</p>

          </td>
        </tr>

        ${(inviteCode || eventUrl) ? `
        <!-- CTA block: invite code + register button -->
        <tr>
          <td style="background:#ffffff;border-left:1px solid #D8E4EF;border-right:1px solid #D8E4EF;padding:0 40px;">

            ${inviteCode ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:#F8F9FF;border-radius:14px;border:1.5px solid #D0DDEA;padding:16px 22px;">
                  <p style="color:#A7C4DE;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 8px;font-family:Arial,sans-serif;">Your Personal Invite Code</p>
                  <p style="color:#1E3263;font-size:26px;font-weight:700;letter-spacing:6px;margin:0;font-family:Arial,sans-serif;">${inviteCode}</p>
                </td>
              </tr>
            </table>` : ''}

            ${eventUrl ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${eventUrl}"
                    style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:14px;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:center;font-family:Arial,sans-serif;">
                    Register Now
                  </a>
                </td>
              </tr>
            </table>` : ''}

          </td>
        </tr>

        <!-- Divider after CTA -->
        <tr>
          <td style="background:#ffffff;border-left:1px solid #D8E4EF;border-right:1px solid #D8E4EF;padding:0 40px 28px;">
            <div style="height:1px;background:#D0DDEA;"></div>
          </td>
        </tr>` : ''}

        <!-- Body content -->
        <tr>
          <td style="background:#ffffff;border-left:1px solid #D8E4EF;border-right:1px solid #D8E4EF;padding:0 40px 40px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F9FF;border:1px solid #D8E4EF;border-top:none;border-radius:0 0 20px 20px;padding:24px 40px;">
            <p style="color:#A7C4DE;font-size:12px;margin:0;text-align:center;font-family:Arial,sans-serif;">
              Impact Gstaad &nbsp;·&nbsp;
              <a href="https://impactgstaad.ch" style="color:#1E3263;text-decoration:none;">impactgstaad.ch</a>
            </p>
            <p style="margin:10px 0 0;text-align:center;">
              <a href="${unsubscribeUrl}" style="color:#A7C4DE;font-size:11px;text-decoration:underline;font-family:Arial,sans-serif;">Unsubscribe</a>
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
