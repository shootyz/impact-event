import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { rateLimit } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { password, eventId } = await req.json()

  const base = supabase()
    .from('events')
    .select('id, registration_password')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true)).single()

  if (!event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  if (!event.registration_password) {
    return NextResponse.json({ ok: true })
  }

  const a = Buffer.from(password ?? '', 'utf8')
  const b = Buffer.from(event.registration_password, 'utf8')
  const match = a.length === b.length && timingSafeEqual(a, b)

  if (!match) {
    return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
