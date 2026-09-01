const BREVO_API = 'https://api.brevo.com/v3'

// A plain-text alternative alongside HTML improves spam-filter scoring
// (SpamAssassin's MIME_HTML_ONLY rule) and helps clients that render text/plain.
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
  tags,
  unsubscribeUrl,
}: {
  to: string
  subject: string
  html: string
  tags?: string[]
  unsubscribeUrl?: string
}): Promise<{ messageId: string }> {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL
  if (!apiKey || !fromEmail) throw new Error('BREVO_API_KEY/BREVO_FROM_EMAIL fehlt.')

  // The List-Unsubscribe header drives the "Unsubscribe" option mail clients
  // (Gmail, Outlook, Apple Mail) show next to the sender, separate from any
  // unsubscribe link in the body — recipients using it instead of hitting
  // "report spam" is a real deliverability/reputation signal.
  const headers = unsubscribeUrl ? { 'List-Unsubscribe': `<${unsubscribeUrl}>` } : undefined

  const response = await fetch(`${BREVO_API}/smtp/email`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: fromEmail, name: 'Impact Gstaad' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: htmlToPlainText(html),
      tags,
      headers,
    }),
  })

  const data = await response.json().catch(() => null) as { messageId?: string; message?: string } | null
  if (!response.ok || !data?.messageId) {
    throw new Error(`Brevo-Versand fehlgeschlagen: ${data?.message ?? `HTTP ${response.status}`}`)
  }
  return { messageId: data.messageId }
}
