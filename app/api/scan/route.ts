import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, passwordsMatch } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkEventPin(eventId: string, pin: string): Promise<boolean> {
  try {
    const db = supabaseAdmin()
    const { data } = await db.from('events').select('scanner_pin').eq('id', eventId).single()
    // Per-event PIN takes priority; fall back to the global SCANNER_PIN if the
    // event has none configured. If neither exists, scanner access is disabled —
    // it must NOT silently grant open access.
    const expected = data?.scanner_pin || process.env.SCANNER_PIN
    if (!expected) return false
    return passwordsMatch(pin, expected)
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok' && body.eventId
    ? await checkEventPin(body.eventId as string, (body.scannerPin as string) ?? '')
    : false
  if (auth !== 'ok' && !scannerOk) {
    return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })
  }

  const { token } = body
  if (!token) return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db.rpc('scan_checkin_atomic', { p_token: token })
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Check-in fehlgeschlagen.' }, { status: 500 })
  }

  const result = data as { status: string; name?: string; email?: string; checked_in_at?: string }
  if (result.status === 'not_found') return NextResponse.json({ error: 'Ungültiger QR-Code.' }, { status: 404 })
  if (result.status === 'already_checked_in') return NextResponse.json({ status: 'already_checked_in', name: result.name, checked_in_at: result.checked_in_at })
  return NextResponse.json({ status: 'success', name: result.name, email: result.email })
}
