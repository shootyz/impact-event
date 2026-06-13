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

  const eventDate = new Date(event.date).toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: registration.email,
    subject: `Deine Anmeldung: ${event.name}`,
    html: `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a1a;padding:32px;text-align:center;">
            <p style="color:#e5e5e5;font-size:13px;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase;">Impact Gstaad</p>
            <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:600;">${event.name}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#333;font-size:16px;margin:0 0 8px;">Hallo ${registration.name},</p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Deine Anmeldung ist bestätigt. Zeige diesen QR-Code am Eingang vor.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                  <p style="color:#888;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Datum &amp; Zeit</p>
                  <p style="color:#1a1a1a;font-size:15px;font-weight:600;margin:0;">${eventDate}</p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="background:#f9f9f9;border-radius:8px;padding:16px 20px;">
                  <p style="color:#888;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Ort</p>
                  <p style="color:#1a1a1a;font-size:15px;font-weight:600;margin:0;">${event.location}</p>
                </td>
              </tr>
            </table>
            <div style="text-align:center;margin:32px 0 24px;">
              <p style="color:#888;font-size:12px;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">Dein persönlicher QR-Code</p>
              <img src="cid:qrcode" width="200" height="200" alt="QR-Code" style="display:block;margin:0 auto;border-radius:8px;"/>
              <p style="color:#aaa;font-size:11px;margin:12px 0 0;">Token: ${registration.qr_token}</p>
            </div>
            <div style="text-align:center;margin:24px 0 0;">
              <a href="${appUrl}/ticket/${registration.qr_token}"
                 style="display:inline-block;background:#1E3263;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Ticket online anzeigen →
              </a>
            </div>
            <div style="text-align:center;margin:12px 0 0;">
              <a href="${appUrl}/api/ticket/${registration.qr_token}/pdf"
                 style="display:inline-block;background:#ffffff;color:#1E3263;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;border:1.5px solid #1E3263;">
                Als PDF speichern ↓
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#aaa;font-size:12px;margin:0;">Impact Gstaad · impactgstaad.ch</p>
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
