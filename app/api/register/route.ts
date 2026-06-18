import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { name, email, invite_code_id, event_id } = await req.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name und E-Mail sind erforderlich.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const base = db.from('events').select('*')
  const { data: event, error: eventError } = await (event_id ? base.eq('id', event_id) : base.eq('active', true)).single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Kein aktiver Event gefunden.' }, { status: 404 })
  }

  const { data: existing } = await db
    .from('registrations')
    .select('id, qr_token')
    .eq('email', email.toLowerCase().trim())
    .eq('event_id', event.id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Diese E-Mail-Adresse ist bereits angemeldet.', token: existing.qr_token },
      { status: 409 }
    )
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
      ...(invite_code_id ? { invite_code_id } : {}),
    })
    .select()
    .single()

  if (regError || !registration) {
    console.error(regError)
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })
  }

  if (invite_code_id) {
    await db.from('invite_codes').update({ used: true }).eq('id', invite_code_id)
  }

  try {
    await sendConfirmationEmail(registration, event)
  } catch (emailError) {
    console.error('E-Mail-Fehler:', emailError)
  }

  return NextResponse.json({ token: qrToken, id: registration.id })
}
