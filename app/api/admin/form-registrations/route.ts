import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

  const { id, status } = body
  const validStatuses = ['pending', 'confirmed', 'rejected', 'waitlisted']
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })

  const { error } = await supabaseAdmin().from('form_registrations').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

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
