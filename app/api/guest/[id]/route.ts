import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { timingSafeEqual } from 'crypto'

async function checkEventPinForReg(regId: string, pin: string): Promise<boolean> {
  try {
    const db = supabaseAdmin()
    const { data: reg } = await db.from('registrations').select('event_id').eq('id', regId).single()
    if (!reg?.event_id) return false
    const { data: ev } = await db.from('events').select('scanner_pin').eq('id', reg.event_id).single()
    if (!ev?.scanner_pin) return false
    const ba = Buffer.from(pin, 'utf8'), bb = Buffer.from(ev.scanner_pin, 'utf8')
    if (ba.length !== bb.length) { timingSafeEqual(bb, bb); return false }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok' && body.scannerPin
    ? await checkEventPinForReg(id, body.scannerPin as string)
    : false
  if (auth !== 'ok' && !scannerOk) return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  await supabaseAdmin().from('registrations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok' && body.scannerPin
    ? await checkEventPinForReg(id, body.scannerPin as string)
    : false
  if (auth !== 'ok' && !scannerOk) return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { checked_in } = body
  await supabaseAdmin().from('registrations').update({ checked_in, ...(checked_in ? { checked_in_at: new Date().toISOString() } : { checked_in_at: null }) }).eq('id', id)
  return NextResponse.json({ ok: true })
}
