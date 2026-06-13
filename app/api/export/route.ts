import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')
  const type = req.nextUrl.searchParams.get('type') // 'all' | 'checkedin' | 'noshows'

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('active', true)
    .single()

  if (!event) {
    return new NextResponse('Kein aktiver Event.', { status: 404 })
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

  const header = 'Name,E-Mail,Eingecheckt,Check-in Zeit,Angemeldet am'
  const lines = (rows || []).map((r) => {
    const checkedIn = r.checked_in ? 'Ja' : 'Nein'
    const checkedInAt = r.checked_in_at
      ? new Date(r.checked_in_at).toLocaleString('de-CH')
      : ''
    const createdAt = new Date(r.created_at).toLocaleString('de-CH')
    return [r.name, r.email, checkedIn, checkedInAt, createdAt]
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
