import { Resend } from 'resend'
import { generateQRCodeDataURL } from './qr'
import type { Registration, Event } from './supabase'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail(
  registration: Registration,
  event: Event
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const qrDataUrl = await generateQRCodeDataURL(registration.qr_token, appUrl)
  const base64 = qrDataUrl.split(',')[1]

  const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: registration.email,
    subject: `Your ticket: ${event.name}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F9FF;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;padding:24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Main card: logo + event name + QR + buttons -->
        <tr>
          <td style="padding-bottom:16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;border:1px solid #D0DDEA;">
              <tr>
                <td style="padding:20px 24px 0;">
                  <!-- Logo + event name inline -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="26" style="display:block;" />
                      </td>
                      <td style="vertical-align:middle;text-align:right;">
                        <p style="color:#D28D28;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 3px;">Your Ticket</p>
                        <p style="color:#1E3263;font-size:16px;font-weight:700;margin:0;">${event.name}</p>
                      </td>
                    </tr>
                  </table>
                  <!-- Divider -->
                  <div style="height:1px;background:#D0DDEA;margin:16px 0;"></div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;">

                  <!-- QR Code -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                    <tr>
                      <td align="center">
                        <img src="cid:qrcode" width="240" height="240" alt="QR Code" style="display:block;margin:0 auto;border-radius:8px;"/>
                        <p style="color:#A7C4DE;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:12px 0 0;">Show this code at the entrance</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Primary button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td>
                        <a href="${appUrl}/ticket/${registration.qr_token}"
                           style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">
                          SHOW TICKET ONLINE
                        </a>
                      </td>
                    </tr>
                  </table>
                  <!-- Secondary button (outline) -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${appUrl}/api/ticket/${registration.qr_token}/pdf"
                           style="display:block;background:transparent;color:#D28D28;text-decoration:none;padding:15px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;border:2px solid #D28D28;">
                          SAVE AS PDF
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Info card: date + location -->
        <tr>
          <td style="padding-bottom:16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #D0DDEA;">
              <tr>
                <td width="50%" style="padding:12px 16px;vertical-align:top;">
                  <p style="color:#A7C4DE;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px;">Date</p>
                  <p style="color:#1E3263;font-size:15px;margin:0;">${eventDate}</p>
                </td>
                <td width="1" style="background:#D0DDEA;"></td>
                <td width="50%" style="padding:12px 16px;vertical-align:top;">
                  <p style="color:#A7C4DE;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px;">Location</p>
                  <p style="color:#1E3263;font-size:15px;margin:0;">${event.location}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <p style="color:#A7C4DE;font-size:12px;margin:0;">Impact Gstaad · impactgstaad.ch</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    attachments: [
      {
        filename: 'qrcode.png',
        content: base64,
        contentId: 'qrcode',
      },
    ],
  })
}
