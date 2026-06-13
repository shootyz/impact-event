import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: events } = await db
    .from('events')
    .select('id, name, date, location, description')
    .eq('active', false)
    .order('date', { ascending: false })

  if (!events?.length) {
    return NextResponse.json({ events: [] })
  }

  const eventIds = events.map(e => e.id)

  // Single query: all registrations for all archived events at once
  const { data: regs } = await db
    .from('registrations')
    .select('event_id, checked_in')
    .in('event_id', eventIds)

  // Count in JS — no extra round trips
  const totals: Record<string, number> = {}
  const checkedIns: Record<string, number> = {}
  for (const r of regs ?? []) {
    totals[r.event_id] = (totals[r.event_id] ?? 0) + 1
    if (r.checked_in) checkedIns[r.event_id] = (checkedIns[r.event_id] ?? 0) + 1
  }

  const enriched = events.map(event => ({
    ...event,
    total: totals[event.id] ?? 0,
    checked_in: checkedIns[event.id] ?? 0,
  }))

  return NextResponse.json({ events: enriched })
}
