import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: events } = await db
    .from('events')
    .select('id, name, date, location, description')
    .eq('active', false)
    .order('date', { ascending: false })

  if (!events?.length) {
    return NextResponse.json({ events: [] })
  }

  const enriched = await Promise.all(
    events.map(async (event) => {
      const { count: total } = await db
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)

      const { count: checkedIn } = await db
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('checked_in', true)

      return { ...event, total: total ?? 0, checked_in: checkedIn ?? 0 }
    })
  )

  return NextResponse.json({ events: enriched })
}
