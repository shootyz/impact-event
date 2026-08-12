import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const db = supabaseAdmin()
  const { data: events } = await db
    .from('events')
    .select('id, name, name_en, name_fr, date, location, location_en, location_fr, description, description_en, description_fr, active, registration_password, slug, category, created_at, registration_type, max_capacity, form_config, scanner_pin')
    .order('date', { ascending: false })

  if (!events?.length) return NextResponse.json([])

  const { data: regs } = await db
    .from('registrations')
    .select('event_id, checked_in')
    .in('event_id', events.map(e => e.id))

  const totals: Record<string, number> = {}
  const checkedIns: Record<string, number> = {}
  for (const r of regs ?? []) {
    totals[r.event_id] = (totals[r.event_id] ?? 0) + 1
    if (r.checked_in) checkedIns[r.event_id] = (checkedIns[r.event_id] ?? 0) + 1
  }

  return NextResponse.json(events.map(e => ({
    ...e,
    total: totals[e.id] ?? 0,
    checked_in: checkedIns[e.id] ?? 0,
  })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { name, name_en, name_fr, date, location, location_en, location_fr, description, description_en, description_fr, registration_password, category, registration_type, max_capacity, form_config, scanner_pin } = body

  if (!name?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: 'Name, Datum und Ort sind erforderlich.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin()
    .from('events')
    .insert({
      name: name.trim(),
      name_en: name_en?.trim() || null,
      name_fr: name_fr?.trim() || null,
      date,
      location: location.trim(),
      location_en: location_en?.trim() || null,
      location_fr: location_fr?.trim() || null,
      description: description?.trim() || null,
      description_en: description_en?.trim() || null,
      description_fr: description_fr?.trim() || null,
      registration_password: registration_password?.trim() || null,
      active: true,
      category: category?.trim() || null,
      registration_type: registration_type ?? 'invite',
      max_capacity: max_capacity ? Number(max_capacity) : null,
      form_config: form_config ?? null,
      scanner_pin: scanner_pin || null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error(error)
    return NextResponse.json({ error: 'Fehler beim Erstellen.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
