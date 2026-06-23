import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { eventId, expectedCount } = body

  // Destructive route: require an explicit eventId. The previous active-event
  // fallback meant a call without eventId silently wiped the *current* event's
  // guest list — too easy to trigger accidentally.
  if (!eventId) return NextResponse.json({ error: 'eventId erforderlich.' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: event } = await db.from('events').select('id').eq('id', eventId).single()
  if (!event) return NextResponse.json({ error: 'Event nicht gefunden.' }, { status: 404 })

  // Optimistic guard: if the caller tells us how many registrations it expects to
  // delete (the count the user saw in the UI) and the live count differs, abort —
  // the list changed since the dialog was opened, so don't delete blindly.
  if (typeof expectedCount === 'number') {
    const { count: current } = await db
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
    if (current !== expectedCount) {
      return NextResponse.json(
        { error: 'Die Gästeliste hat sich seit dem Öffnen geändert. Bitte neu laden und erneut versuchen.' },
        { status: 409 }
      )
    }
  }

  const { count } = await db.from('registrations').delete({ count: 'exact' }).eq('event_id', event.id)
  return NextResponse.json({ deleted: count })
}
