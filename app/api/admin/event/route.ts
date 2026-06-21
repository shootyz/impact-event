import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const adminPassword = req.nextUrl.searchParams.get('password')
  const auth = checkAdminAuth(req, body ?? {}); if (auth !== 'ok') {
    return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })
  }
  const { data: events } = await supabaseAdmin()
    .from('events')
    .select('id, name, date, registration_password')
    .eq('active', true)
    .order('date', { ascending: true })
  return NextResponse.json({ events: events ?? [] })
}

export async function PATCH(req: NextRequest) {
  const { adminPassword, eventId, registration_password } = await req.json()

  const auth = checkAdminAuth(req, body ?? {}); if (auth !== 'ok') {
    return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })
  }

  const db = supabaseAdmin()

  if (eventId) {
    await db
      .from('events')
      .update({ registration_password: registration_password || null })
      .eq('id', eventId)
  } else {
    // fallback: update the single active event
    const { data: ev } = await db.from('events').select('id').eq('active', true).single()
    if (!ev) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
    await db.from('events').update({ registration_password: registration_password || null }).eq('id', ev.id)
  }

  return NextResponse.json({ ok: true })
}
