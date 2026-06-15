import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = supabaseAdmin()

  const { data: registration } = await db
    .from('registrations')
    .select('*')
    .eq('qr_token', token)
    .single()

  if (!registration) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('id', registration.event_id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  await sendConfirmationEmail(registration, event)
  return NextResponse.json({ ok: true })
}
