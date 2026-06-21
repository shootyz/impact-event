import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { eventId } = body
  const db = supabaseAdmin()
  const base = db.from('events').select('id')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true).order('date', { ascending: true }).limit(1)).single()
  if (!event) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })

  const { count } = await db.from('registrations').delete({ count: 'exact' }).eq('event_id', event.id)
  return NextResponse.json({ deleted: count })
}
