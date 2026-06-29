import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { timingSafeEqual } from 'crypto'

async function checkEventPin(eventId: string, pin: string): Promise<boolean> {
  try {
    const db = supabaseAdmin()
    const { data } = await db.from('events').select('scanner_pin').eq('id', eventId).single()
    if (!data?.scanner_pin) return true  // no PIN set = open access
    const ba = Buffer.from(pin, 'utf8'), bb = Buffer.from(data.scanner_pin, 'utf8')
    if (ba.length !== bb.length) { timingSafeEqual(bb, bb); return false }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')
  const scanPin = req.headers.get('x-scanner-pin') ?? ''

  const _auth = checkAdminAuth(req);
  const scannerOk = _auth !== 'ok' && eventId
    ? await checkEventPin(eventId, scanPin)
    : false
  if (_auth !== 'ok' && !scannerOk) {
    return NextResponse.json({ error: _auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: _auth === 'rate_limited' ? 429 : 401 })
  }

  const db = supabaseAdmin()

  const base = db.from('events').select('id, name, date, location, description, active, registration_type')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true).order('date', { ascending: true }).limit(1)).single()

  if (!event) {
    return NextResponse.json({ registrations: [], event: null })
  }

  // Form events: canonical list is form_registrations, joined with registrations for check-in
  if ((event as { registration_type?: string }).registration_type === 'form') {
    const { data: formRegs } = await db
      .from('form_registrations')
      .select('id, first_name, last_name, email, created_at')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })

    if (!formRegs?.length) return NextResponse.json({ registrations: [], event })

    const emails = formRegs.map(r => r.email)
    const { data: regs } = await db
      .from('registrations')
      .select('id, email, checked_in, checked_in_at, qr_token')
      .eq('event_id', event.id)
      .in('email', emails)

    const regMap = new Map((regs ?? []).map(r => [r.email, r]))

    const registrations = formRegs.map(r => {
      const reg = regMap.get(r.email)
      return {
        id: reg?.id ?? null,          // registrations.id — for check-in via /api/guest/[id]
        form_reg_id: r.id,            // form_registrations.id — for delete
        name: `${r.first_name} ${r.last_name}`,
        email: r.email,
        checked_in: reg?.checked_in ?? false,
        checked_in_at: reg?.checked_in_at ?? null,
        qr_token: reg?.qr_token ?? null,
        created_at: r.created_at,
      }
    })

    return NextResponse.json({ registrations, event })
  }

  // Invite events: use registrations directly
  const { data: registrations } = await db
    .from('registrations')
    .select('id, name, email, checked_in, checked_in_at, created_at, qr_token')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ registrations: registrations || [], event })
}
