import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const adminPassword = req.nextUrl.searchParams.get('password')
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data: events } = await db
    .from('events')
    .select('id, name, date, location, description, active, registration_password, slug, category, created_at')
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
  const { adminPassword, name, date, location, description, registration_password, category } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  if (!name?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: 'Name, Datum und Ort sind erforderlich.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin()
    .from('events')
    .insert({
      name: name.trim(),
      date,
      location: location.trim(),
      description: description?.trim() || null,
      registration_password: registration_password?.trim() || null,
      active: true,
      category: category?.trim() || null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error(error)
    return NextResponse.json({ error: 'Fehler beim Erstellen.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
