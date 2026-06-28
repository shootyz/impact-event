import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { sendConfirmationEmail } from '@/lib/email'
import { upsertContact } from '@/lib/hubspot'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' }, { status: 429 })
  }

  const body = await req.json()
  const { event_id, first_name, last_name, email, extra_fields } = body

  if (!event_id || !first_name || !last_name || !email) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data, error } = await db.rpc('register_form_atomic', {
    p_event_id: event_id,
    p_first_name: first_name,
    p_last_name: last_name,
    p_email: email,
    p_company: null,
    p_message: null,
    p_extra_fields: extra_fields ?? null,
  })

  if (error) return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })

  const result = data as { ok?: boolean; error?: string }
  if (result.error === 'event_not_found') return NextResponse.json({ error: 'Event nicht gefunden.' }, { status: 404 })
  if (result.error === 'not_form_event') return NextResponse.json({ error: 'Dieses Event nutzt kein Formular.' }, { status: 400 })
  if (result.error === 'duplicate') return NextResponse.json({ error: 'Diese E-Mail-Adresse wurde bereits registriert.' }, { status: 409 })
  if (result.error === 'capacity_full') return NextResponse.json({ error: 'capacity_full' }, { status: 409 })
  if (!result.ok) return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })

  const { data: event } = await db.from('events').select('*').eq('id', event_id).single()

  // Create registration entry for ticket/QR system
  const qrToken = randomUUID()
  const fullName = `${first_name} ${last_name}`
  const { data: registration } = await db
    .from('registrations')
    .insert({ name: fullName, email: email.toLowerCase().trim(), event_id, qr_token: qrToken, checked_in: false })
    .select()
    .single()

  after(async () => {
    try {
      // Send ticket with QR code to registrant
      if (registration && event) {
        await sendConfirmationEmail(registration, event, 'de')
      }

      // Sync to HubSpot
      await upsertContact({ email, first_name, last_name, company: extra_fields?.firma ?? null, event_name: event?.name })

      // Notify admin
      const extraRows = extra_fields
        ? Object.entries(extra_fields as Record<string, string>)
            .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666">${k}</td><td style="padding:4px 8px">${v}</td></tr>`)
            .join('')
        : ''
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'info@impactgstaad.ch',
        subject: `Neue Anmeldung: ${fullName} → ${event?.name ?? 'Event'}`,
        html: `<h3>Neue Formular-Anmeldung</h3><table>
          <tr><td style="padding:4px 8px;color:#666">Name</td><td style="padding:4px 8px">${fullName}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">E-Mail</td><td style="padding:4px 8px">${email}</td></tr>
          ${extraRows}</table>`,
      })
    } catch (e) {
      console.error('Form registration email failed:', e)
    }
  })

  return NextResponse.json({ ok: true, qr_token: qrToken })
}
