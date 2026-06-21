import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = checkAdminAuth(req)

  const _auth = checkAdminAuth(req); if (_auth !== 'ok') {
    return NextResponse.json({ error: _auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: _auth === 'rate_limited' ? 429 : 401 })
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
