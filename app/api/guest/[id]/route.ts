import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, passwordsMatch } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkEventPinForReg(regId: string, pin: string): Promise<boolean> {
  try {
    const db = supabaseAdmin()
    const { data: reg } = await db.from('registrations').select('event_id').eq('id', regId).single()
    if (!reg?.event_id) return false
    const { data: ev } = await db.from('events').select('scanner_pin').eq('id', reg.event_id).single()
    // Per-event PIN takes priority; fall back to the global SCANNER_PIN if the
    // event has none configured. If neither exists, scanner access is disabled —
    // it must NOT silently grant open access.
    const expected = ev?.scanner_pin || process.env.SCANNER_PIN
    if (!expected) return false
    return passwordsMatch(pin, expected)
  } catch { return false }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok'
    ? await checkEventPinForReg(id, (body.scannerPin as string) ?? '')
    : false
  if (auth !== 'ok' && !scannerOk) return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  await supabaseAdmin().from('registrations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok'
    ? await checkEventPinForReg(id, (body.scannerPin as string) ?? '')
    : false
  if (auth !== 'ok' && !scannerOk) return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { checked_in } = body
  await supabaseAdmin().from('registrations').update({ checked_in, ...(checked_in ? { checked_in_at: new Date().toISOString() } : { checked_in_at: null }) }).eq('id', id)
  return NextResponse.json({ ok: true })
}
