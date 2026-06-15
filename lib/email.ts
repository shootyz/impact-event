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
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="32" style="display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding-bottom:28px;">
            <div style="height:1px;background:#D0DDEA;"></div>
          </td>
        </tr>

        <!-- Event label + name -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <p style="color:#D28D28;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">YOUR TICKET</p>
            <h1 style="color:#1E3263;font-size:24px;font-weight:700;margin:0 0 6px;">${event.name}</h1>
            ${event.description ? `<p style="color:#A7C4DE;font-size:13px;margin:0;">${event.description}</p>` : ''}
          </td>
        </tr>

        <!-- Info card -->
        <tr>
          <td style="padding-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;border:2px solid #D28D28;">
              <tr>
                <td width="50%" style="padding:16px 20px;vertical-align:top;">
                  <p style="color:#A7C4DE;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">Date</p>
                  <p style="color:#1E3263;font-size:13px;margin:0;">${eventDate}</p>
                </td>
                <td width="1" style="background:#D0DDEA;"></td>
                <td width="50%" style="padding:16px 20px;vertical-align:top;">
                  <p style="color:#A7C4DE;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">Location</p>
                  <p style="color:#1E3263;font-size:13px;margin:0;">${event.location}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main card: greeting + QR + buttons -->
        <tr>
          <td style="padding-bottom:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;border:1px solid #D0DDEA;">
              <tr>
                <td style="padding:28px 32px;">

                  <p style="color:#1E3263;font-size:15px;margin:0 0 6px;font-weight:600;">Hello ${registration.name},</p>
                  <p style="color:#1E3263;font-size:13px;line-height:1.6;margin:0 0 28px;">
                    Your registration is confirmed. Please show this QR code at the entrance.
                  </p>

                  <!-- QR Code -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <p style="color:#A7C4DE;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Your personal QR code</p>
                        <img src="cid:qrcode" width="180" height="180" alt="QR Code" style="display:block;margin:0 auto;border-radius:8px;"/>
                      </td>
                    </tr>
                  </table>

                  <!-- Buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td align="center">
                        <a href="${appUrl}/ticket/${registration.qr_token}"
                           style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">
                          SHOW TICKET ONLINE
                        </a>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${appUrl}/api/ticket/${registration.qr_token}/pdf"
                           style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">
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

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
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
