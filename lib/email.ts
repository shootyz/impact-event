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
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #D0DDEA;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 20px;border-bottom:3px solid #D28D28;">
            <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="28" style="display:block;margin:0 0 16px;" />
            <h1 style="color:#1E3263;font-size:22px;margin:0;font-weight:700;">${event.name}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <p style="color:#1E3263;font-size:16px;margin:0 0 6px;font-weight:600;">Hello ${registration.name},</p>
            <p style="color:#1E3263;font-size:14px;line-height:1.6;margin:0 0 28px;">
              Your registration is confirmed. Please show this QR code at the entrance.
            </p>

            <!-- Date & Location -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#F8F9FF;border-radius:10px;padding:14px 18px;border:1px solid #D0DDEA;">
                  <p style="color:#A7C4DE;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px;">Date</p>
                  <p style="color:#1E3263;font-size:14px;margin:0;">${eventDate}</p>
                </td>
              </tr>
              <tr><td style="height:10px;"></td></tr>
              <tr>
                <td style="background:#F8F9FF;border-radius:10px;padding:14px 18px;border:1px solid #D0DDEA;">
                  <p style="color:#A7C4DE;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px;">Location</p>
                  <p style="color:#1E3263;font-size:14px;margin:0;">${event.location}</p>
                </td>
              </tr>
            </table>

            <!-- QR Code -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td align="center">
                  <p style="color:#A7C4DE;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Your personal QR code</p>
                  <img src="cid:qrcode" width="200" height="200" alt="QR Code" style="display:block;margin:0 auto;border-radius:10px;"/>
                </td>
              </tr>
            </table>

            <!-- Buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}/ticket/${registration.qr_token}"
                     style="display:inline-block;background:#D28D28;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
                    SHOW TICKET ONLINE
                  </a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/api/ticket/${registration.qr_token}/pdf"
                     style="display:inline-block;background:#D28D28;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
                    SAVE AS PDF
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F9FF;padding:18px 32px;text-align:center;border-top:1px solid #D0DDEA;">
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
