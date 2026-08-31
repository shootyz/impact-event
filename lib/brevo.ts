const BREVO_API = 'https://api.brevo.com/v3'

export async function sendTransactionalEmail({
  to,
  subject,
  html,
  tags,
}: {
  to: string
  subject: string
  html: string
  tags?: string[]
}): Promise<{ messageId: string }> {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL
  if (!apiKey || !fromEmail) throw new Error('BREVO_API_KEY/BREVO_FROM_EMAIL fehlt.')

  const response = await fetch(`${BREVO_API}/smtp/email`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: fromEmail, name: 'Impact Gstaad' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      tags,
    }),
  })

  const data = await response.json().catch(() => null) as { messageId?: string; message?: string } | null
  if (!response.ok || !data?.messageId) {
    throw new Error(`Brevo-Versand fehlgeschlagen: ${data?.message ?? `HTTP ${response.status}`}`)
  }
  return { messageId: data.messageId }
}
