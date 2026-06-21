import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') {
    return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })
  }

  const { email } = body
  if (!email?.trim()) return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: event } = await db.from('events').select('*').eq('active', true).single()
  if (!event) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })

  const { data: registration } = await db
    .from('registrations')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('event_id', event.id)
    .single()

  if (!registration) return NextResponse.json({ error: 'Keine Anmeldung für diese E-Mail gefunden.' }, { status: 404 })

  await sendConfirmationEmail(registration, event)
  return NextResponse.json({ name: registration.name })
}
