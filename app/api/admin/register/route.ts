import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { randomUUID, timingSafeEqual } from 'crypto'

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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok' && body.scannerPin && body.eventId
    ? await checkEventPin(body.eventId as string, body.scannerPin as string)
    : false
  if (auth !== 'ok' && !scannerOk) return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { name, email, eventId } = body
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: 'Name und E-Mail erforderlich.' }, { status: 400 })

  const db = supabaseAdmin()
  const base = db.from('events').select('*')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true).order('date', { ascending: true }).limit(1)).single()
  if (!event) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })

  const { data: existing } = await db.from('registrations').select('id').eq('email', email.toLowerCase().trim()).eq('event_id', event.id).single()
  if (existing) return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 })

  const { data: registration, error } = await db
    .from('registrations')
    .insert({ name: name.trim(), email: email.toLowerCase().trim(), event_id: event.id, qr_token: randomUUID(), checked_in: false })
    .select().single()

  if (error || !registration) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })

  try { await sendConfirmationEmail(registration, event, 'en') } catch (e) { console.error('E-Mail-Fehler:', e) }
  return NextResponse.json({ ok: true })
}
