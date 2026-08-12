import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLang, resolveLangField } from '@/lib/i18n'
import { isTicketTokenExpired } from '@/lib/ticketToken'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const lang = getLang(req.nextUrl.searchParams)
  const { data } = await supabaseAdmin()
    .from('registrations')
    .select('name, email, events(name, name_en, name_fr, date, location, location_en, location_fr)')
    .eq('qr_token', token)
    .single()

  if (!data) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const event = Array.isArray(data.events) ? data.events[0] : data.events
  if (!event) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  if (isTicketTokenExpired(event.date)) {
    return NextResponse.json({ error: 'Dieser Ticket-Link ist abgelaufen.' }, { status: 410 })
  }

  return NextResponse.json({
    name: data.name,
    email: data.email,
    event: {
      name: resolveLangField(lang, event.name, event.name_en, event.name_fr),
      date: event.date,
      location: resolveLangField(lang, event.location, event.location_en, event.location_fr),
    },
  })
}
