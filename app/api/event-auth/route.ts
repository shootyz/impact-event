import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { password, eventId } = await req.json()

  const base = supabase()
    .from('events')
    .select('id, registration_password')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true)).single()

  if (!event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  if (!event.registration_password) {
    return NextResponse.json({ ok: true })
  }

  if (password !== event.registration_password) {
    return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
