import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email, adminPassword } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  if (!email?.trim()) {
    return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('active', true)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  const { data: registration } = await db
    .from('registrations')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('event_id', event.id)
    .single()

  if (!registration) {
    return NextResponse.json({ error: 'Keine Anmeldung für diese E-Mail gefunden.' }, { status: 404 })
  }

  await sendConfirmationEmail(registration, event)

  return NextResponse.json({ name: registration.name })
}
