import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')
  const eventId = req.nextUrl.searchParams.get('eventId')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const base = db.from('events').select('id, name, date, location, description, registration_password, active')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true).order('date', { ascending: true }).limit(1)).single()

  if (!event) {
    return NextResponse.json({ registrations: [], event: null })
  }

  const { data: registrations } = await db
    .from('registrations')
    .select('id, name, email, checked_in, checked_in_at, created_at')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ registrations: registrations || [], event })
}
