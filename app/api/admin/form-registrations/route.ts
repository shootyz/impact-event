import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { timingSafeEqual } from 'crypto'

async function checkEventPinForFormReg(formRegId: string, pin: string): Promise<boolean> {
  try {
    const db = supabaseAdmin()
    const { data: fr } = await db.from('form_registrations').select('event_id').eq('id', formRegId).single()
    if (!fr?.event_id) return false
    const { data: ev } = await db.from('events').select('scanner_pin').eq('id', fr.event_id).single()
    if (!ev?.scanner_pin) return true
    const ba = Buffer.from(pin, 'utf8'), bb = Buffer.from(ev.scanner_pin, 'utf8')
    if (ba.length !== bb.length) { timingSafeEqual(bb, bb); return false }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export async function GET(req: NextRequest) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId fehlt.' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('form_registrations')
    .select('id, first_name, last_name, email, company, message, extra_fields, status, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Join with registrations to get checked_in status + qr_token
  const emails = (data ?? []).map((r: { email: string }) => r.email)
  const { data: regs } = emails.length
    ? await db.from('registrations').select('email, qr_token, checked_in, checked_in_at').eq('event_id', eventId).in('email', emails)
    : { data: [] }
  const regMap = new Map((regs ?? []).map((r: { email: string; qr_token: string; checked_in: boolean; checked_in_at: string | null }) => [r.email, r]))

  const enriched = (data ?? []).map((r: { email: string }) => ({
    ...r,
    checked_in: regMap.get(r.email)?.checked_in ?? false,
    checked_in_at: regMap.get(r.email)?.checked_in_at ?? null,
    qr_token: regMap.get(r.email)?.qr_token ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id, status, first_name, last_name, email, company, extra_fields } = body
  const db = supabaseAdmin()

  // Status-only update
  if (status !== undefined) {
    const validStatuses = ['pending', 'confirmed', 'rejected', 'waitlisted']
    if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })
    const { error } = await db.from('form_registrations').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Full field update
  const updates: Record<string, unknown> = {}
  if (first_name !== undefined) updates.first_name = first_name
  if (last_name !== undefined) updates.last_name = last_name
  if (email !== undefined) updates.email = email
  if (company !== undefined) updates.company = company
  if (extra_fields !== undefined) updates.extra_fields = extra_fields

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Felder angegeben.' }, { status: 400 })

  const { error } = await db.from('form_registrations').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync email in linked registrations row if email changed
  if (email !== undefined) {
    const { data: fr } = await db.from('form_registrations').select('event_id').eq('id', id).single()
    if (fr?.event_id) {
      // find old email to update
      await db.from('registrations').update({ email, name: `${first_name ?? ''} ${last_name ?? ''}`.trim() }).eq('id', id)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  const scannerOk = auth !== 'ok' && body.id
    ? await checkEventPinForFormReg(body.id as string, (body.scannerPin as string) ?? '')
    : false
  if (auth !== 'ok' && !scannerOk) return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id } = body
  if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })

  const db = supabaseAdmin()
  // Also delete linked registration (for QR/ticket)
  const { data: fr } = await db.from('form_registrations').select('email, event_id').eq('id', id).single()
  await db.from('form_registrations').delete().eq('id', id)
  if (fr?.email) {
    await db.from('registrations').delete().eq('email', fr.email).eq('event_id', fr.event_id)
  }
  return NextResponse.json({ ok: true })
}
