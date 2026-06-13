import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name und E-Mail sind erforderlich.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: event, error: eventError } = await db
    .from('events')
    .select('*')
    .eq('active', true)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Kein aktiver Event gefunden.' }, { status: 404 })
  }

  const { data: existing } = await db
    .from('registrations')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('event_id', event.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits angemeldet.' }, { status: 409 })
  }

  const qrToken = randomUUID()

  const { data: registration, error: regError } = await db
    .from('registrations')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      event_id: event.id,
      qr_token: qrToken,
      checked_in: false,
    })
    .select()
    .single()

  if (regError || !registration) {
    console.error(regError)
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })
  }

  try {
    await sendConfirmationEmail(registration, event)
  } catch (emailError) {
    console.error('E-Mail-Fehler:', emailError)
  }

  return NextResponse.json({ token: qrToken, id: registration.id })
}
