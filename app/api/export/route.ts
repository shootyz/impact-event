import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = checkAdminAuth(req)
  const type = req.nextUrl.searchParams.get('type') // 'all' | 'checkedin' | 'noshows'
  const eventId = req.nextUrl.searchParams.get('eventId')

  const _auth = checkAdminAuth(req); if (_auth !== 'ok') {
    return NextResponse.json({ error: _auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: _auth === 'rate_limited' ? 429 : 401 })
  }

  const db = supabaseAdmin()

  const eventQuery = eventId
    ? db.from('events').select('*').eq('id', eventId).single()
    : db.from('events').select('*').eq('active', true).single()

  const { data: event } = await eventQuery

  if (!event) {
    return new NextResponse('Event nicht gefunden.', { status: 404 })
  }

  let query = db
    .from('registrations')
    .select('name, email, checked_in, checked_in_at, created_at')
    .eq('event_id', event.id)
    .order('name', { ascending: true })

  if (type === 'checkedin') {
    query = query.eq('checked_in', true)
  } else if (type === 'noshows') {
    query = query.eq('checked_in', false)
  }

  const { data: rows } = await query

  const header = 'Vorname,Name,E-Mail,Eingecheckt,Check-in Zeit,Angemeldet am'
  const lines = (rows || []).map((r) => {
    const parts = (r.name || '').trim().split(' ')
    const vorname = parts[0] || ''
    const nachname = parts.slice(1).join(' ')
    const checkedIn = r.checked_in ? 'Ja' : 'Nein'
    const checkedInAt = r.checked_in_at
      ? new Date(r.checked_in_at).toLocaleString('de-CH')
      : ''
    const createdAt = new Date(r.created_at).toLocaleString('de-CH')
    return [vorname, nachname, r.email, checkedIn, checkedInAt, createdAt]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  })

  const csv = [header, ...lines].join('\r\n')
  const filename =
    type === 'checkedin'
      ? `eingecheckt_${event.name.replace(/\s+/g, '_')}.csv`
      : type === 'noshows'
      ? `noshows_${event.name.replace(/\s+/g, '_')}.csv`
      : `gaesteliste_${event.name.replace(/\s+/g, '_')}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
