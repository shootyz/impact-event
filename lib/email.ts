import { Resend } from 'resend'
import { generateQRCodeDataURL } from './qr'
import type { Registration, Event } from './supabase'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const STRINGS = {
  en: {
    subject: (name: string) => `Your ticket: ${name}`,
    ticketFor: 'Ticket for',
    showQr: 'Show this QR code at the entrance',
    showOnline: 'SHOW TICKET ONLINE',
    savePdf: 'SAVE AS PDF',
    dateLocale: 'en-GB' as const,
  },
  de: {
    subject: (name: string) => `Dein Ticket: ${name}`,
    ticketFor: 'Ticket für',
    showQr: 'Zeige diesen QR-Code am Eingang',
    showOnline: 'TICKET ONLINE ANZEIGEN',
    savePdf: 'ALS PDF SPEICHERN',
    dateLocale: 'de-DE' as const,
  },
  fr: {
    subject: (name: string) => `Votre billet : ${name}`,
    ticketFor: 'Billet pour',
    showQr: 'Montrez ce QR code à l\'entrée',
    showOnline: 'VOIR LE BILLET EN LIGNE',
    savePdf: 'ENREGISTRER EN PDF',
    dateLocale: 'fr-FR' as const,
  },
}

export async function sendConfirmationEmail(
  registration: Registration,
  event: Event,
  lang: 'en' | 'de' | 'fr' = 'en'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const s = STRINGS[lang] ?? STRINGS.en
  const qrDataUrl = await generateQRCodeDataURL(registration.qr_token, appUrl)
  const base64 = qrDataUrl.split(',')[1]

  const eventDate = new Date(event.date).toLocaleDateString(s.dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: registration.email,
    subject: s.subject(event.name),
    html: `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F9FF;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;padding:24px 16px 48px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Ticket card -->
        <tr>
          <td style="padding-bottom:14px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #D0DDEA;overflow:hidden;">

              <!-- Header: logo + event info -->
              <tr>
                <td style="padding:28px 28px 24px;">
                  <img src="${appUrl}/logo.png" alt="Impact Gstaad" height="33" style="display:block;margin-bottom:20px;" />
                  <p style="color:#1E3263;font-size:18px;font-weight:700;margin:0 0 6px;line-height:1.3;">${event.name}</p>
                  <p style="color:#1E3263;font-size:13px;margin:0 0 3px;">${eventDate}</p>
                  <p style="color:#1E3263;font-size:13px;margin:0;">${event.location}</p>
                </td>
              </tr>

              <!-- Gold divider -->
              <tr><td style="height:2px;background:#D28D28;"></td></tr>

              <!-- Ticket for + QR -->
              <tr>
                <td style="padding:20px 24px 0;">
                  <p style="color:#1E3263;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;opacity:0.5;">${s.ticketFor}</p>
                  <p style="color:#1E3263;font-size:16px;font-weight:700;margin:0 0 20px;">${registration.name}</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <img src="cid:qrcode" width="260" height="260" style="display:block;border-radius:10px;" alt="QR Code"/>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer text -->
              <tr>
                <td style="padding:12px 24px 20px;">
                  <p style="color:#1E3263;font-size:13px;text-align:center;margin:0;">${s.showQr}</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Buttons outside card -->
        <tr>
          <td style="padding-bottom:10px;">
            <a href="${appUrl}/ticket/${registration.qr_token}"
               style="display:block;background:#D28D28;color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">
              ${s.showOnline}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:24px;">
            <a href="${appUrl}/api/ticket/${registration.qr_token}/pdf"
               style="display:block;background:transparent;color:#1E3263;text-decoration:none;padding:13px 32px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;border:2px solid #1E3263;">
              ${s.savePdf}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <p style="color:#A7C4DE;font-size:12px;margin:0;">Impact Gstaad · <a href="https://impactgstaad.ch" style="color:#1E3263;text-decoration:none;">impactgstaad.ch</a></p>
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
