import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')

  const _auth = checkAdminAuth(req); if (_auth !== 'ok') {
    return NextResponse.json({ error: _auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: _auth === 'rate_limited' ? 429 : 401 })
  }

  const db = supabaseAdmin()

  const base = db.from('events').select('id, name, date, location, description, active')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true).order('date', { ascending: true }).limit(1)).single()

  if (!event) {
    return NextResponse.json({ registrations: [], event: null })
  }

  const { data: registrations } = await db
    .from('registrations')
    .select('id, name, email, checked_in, checked_in_at, created_at')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ registrations: registrations || [], event })
}
