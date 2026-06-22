import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 3, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

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
