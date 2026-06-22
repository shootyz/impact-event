import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' }, { status: 429 })
  }

  const body = await req.json()
  const { event_id, first_name, last_name, email, company, message, extra_fields } = body

  if (!event_id || !first_name || !last_name || !email) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Atomic: lock event row, check duplicate + capacity, insert — all in one transaction
  const { data, error } = await db.rpc('register_form_atomic', {
    p_event_id: event_id,
    p_first_name: first_name,
    p_last_name: last_name,
    p_email: email,
    p_company: company ?? null,
    p_message: message ?? null,
    p_extra_fields: extra_fields ?? null,
  })

  if (error) return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })

  const result = data as { ok?: boolean; error?: string; id?: string }
  if (result.error === 'event_not_found') return NextResponse.json({ error: 'Event nicht gefunden.' }, { status: 404 })
  if (result.error === 'not_form_event') return NextResponse.json({ error: 'Dieses Event nutzt kein Formular.' }, { status: 400 })
  if (result.error === 'duplicate') return NextResponse.json({ error: 'Diese E-Mail-Adresse wurde bereits registriert.' }, { status: 409 })
  if (result.error === 'capacity_full') return NextResponse.json({ error: 'capacity_full' }, { status: 409 })
  if (!result.ok) return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })

  // Fetch event name for emails
  const { data: event } = await db.from('events').select('name, date').eq('id', event_id).single()

  after(async () => {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL!
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? 'info@impactgstaad.ch'
      const eventName = event?.name ?? 'Event'
      const fullName = `${first_name} ${last_name}`

      // Build extra fields summary for admin email
      const extraRows = extra_fields
        ? Object.entries(extra_fields as Record<string, string>)
            .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666">${k}</td><td style="padding:4px 8px">${v}</td></tr>`)
            .join('')
        : ''

      await Promise.all([
        // Confirmation to registrant
        resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Anmeldung bestätigt: ${eventName}`,
          html: `
            <p>Liebe/r ${fullName}</p>
            <p>Vielen Dank für Ihre Anmeldung zum <strong>${eventName}</strong>.</p>
            <p>Wir haben Ihre Anmeldung erhalten und melden uns bei Ihnen.</p>
            <p>Freundliche Grüsse<br>Impact Gstaad Team</p>
          `,
        }),
        // Notification to admin
        resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject: `Neue Anmeldung: ${fullName} → ${eventName}`,
          html: `
            <h3>Neue Formular-Anmeldung</h3>
            <table>
              <tr><td style="padding:4px 8px;color:#666">Name</td><td style="padding:4px 8px">${fullName}</td></tr>
              <tr><td style="padding:4px 8px;color:#666">E-Mail</td><td style="padding:4px 8px">${email}</td></tr>
              ${company ? `<tr><td style="padding:4px 8px;color:#666">Firma</td><td style="padding:4px 8px">${company}</td></tr>` : ''}
              ${message ? `<tr><td style="padding:4px 8px;color:#666">Nachricht</td><td style="padding:4px 8px">${message}</td></tr>` : ''}
              ${extraRows}
            </table>
          `,
        }),
      ])
    } catch (e) {
      console.error('Form registration email failed:', e)
    }
  })

  return NextResponse.json({ ok: true })
}
