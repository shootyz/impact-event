import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { timingSafeEqual } from 'crypto'

async function checkEventPin(eventId: string, pin: string): Promise<boolean> {
  try {
    const db = supabaseAdmin()
    const { data } = await db.from('events').select('scanner_pin').eq('id', eventId).single()
    if (!data?.scanner_pin) return false
    const ba = Buffer.from(pin, 'utf8'), bb = Buffer.from(data.scanner_pin, 'utf8')
    if (ba.length !== bb.length) { timingSafeEqual(bb, bb); return false }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')
  const scanPin = req.headers.get('x-scanner-pin') ?? ''

  const _auth = checkAdminAuth(req);
  const scannerOk = _auth !== 'ok' && scanPin && eventId
    ? await checkEventPin(eventId, scanPin)
    : false
  if (_auth !== 'ok' && !scannerOk) {
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
    .select('id, name, email, checked_in, checked_in_at, created_at, qr_token')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ registrations: registrations || [], event })
}
