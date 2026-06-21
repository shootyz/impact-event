import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId fehlt.' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .from('form_registrations')
    .select('id, first_name, last_name, email, company, message, extra_fields, status, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
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
