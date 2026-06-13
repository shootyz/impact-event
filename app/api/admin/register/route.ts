import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { adminPassword, name, email } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name und E-Mail erforderlich.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: event } = await db.from('events').select('id').eq('active', true).single()
  if (!event) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })

  const { data: existing } = await db
    .from('registrations')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('event_id', event.id)
    .single()

  if (existing) return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 })

  const { data, error } = await db
    .from('registrations')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      event_id: event.id,
      qr_token: randomUUID(),
      checked_in: false,
    })
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
