import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event_id, first_name, last_name, email, company, message, extra_fields } = body

  if (!event_id || !first_name || !last_name || !email) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Load event: check type + capacity
  const { data: event, error: evErr } = await db
    .from('events')
    .select('id, name, registration_type, max_capacity')
    .eq('id', event_id)
    .single()

  if (evErr || !event) return NextResponse.json({ error: 'Event nicht gefunden.' }, { status: 404 })
  if (event.registration_type !== 'form') return NextResponse.json({ error: 'Dieses Event nutzt kein Formular.' }, { status: 400 })

  // Capacity check
  if (event.max_capacity) {
    const { count } = await db
      .from('form_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .in('status', ['pending', 'confirmed'])
    if ((count ?? 0) >= event.max_capacity) {
      return NextResponse.json({ error: 'capacity_full' }, { status: 409 })
    }
  }

  // Duplicate check
  const { data: existing } = await db
    .from('form_registrations')
    .select('id')
    .eq('event_id', event_id)
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Diese E-Mail-Adresse wurde bereits registriert.' }, { status: 409 })
  }

  const { error: insertErr } = await db.from('form_registrations').insert({
    event_id,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: email.toLowerCase().trim(),
    company: company?.trim() || null,
    message: message?.trim() || null,
    extra_fields: extra_fields ?? null,
    status: 'pending',
  })

  if (insertErr) return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
