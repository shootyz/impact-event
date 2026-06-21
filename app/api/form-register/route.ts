import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

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

  return NextResponse.json({ ok: true })
}
