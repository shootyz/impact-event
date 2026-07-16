import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' }, { status: 429 })
  }

  const { name, email, invite_code_id, event_id, lang } = await req.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name und E-Mail sind erforderlich.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Verify the event is invite-type and that the invite_code_id actually belongs
  // to this event — prevents registering without a valid code or cross-event code reuse
  if (event_id) {
    const { data: event } = await db
      .from('events')
      .select('registration_type')
      .eq('id', event_id)
      .single()

    if (event?.registration_type === 'invite') {
      if (!invite_code_id) {
        return NextResponse.json({ error: 'Einladungscode erforderlich.' }, { status: 400 })
      }
      // Confirm code belongs to this event and is unused
      const { data: code } = await db
        .from('invite_codes')
        .select('id, used, members(event_id)')
        .eq('id', invite_code_id)
        .single()

      const memberEventId = code
        ? (Array.isArray(code.members) ? code.members[0] : code.members as { event_id: string } | null)?.event_id
        : null

      if (!code || code.used || memberEventId !== event_id) {
        return NextResponse.json({ error: 'Ungültiger oder bereits verwendeter Einladungscode.' }, { status: 400 })
      }
    }
  }

  const { data, error: rpcError } = await db.rpc('register_invite_atomic', {
    p_event_id: event_id ?? null,
    p_name: name.trim(),
    p_email: email.toLowerCase().trim(),
    p_invite_code_id: invite_code_id ?? null,
  })

  if (rpcError) {
    console.error(rpcError)
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })
  }

  const result = data as { ok?: boolean; error?: string; token?: string; id?: string; event_id?: string }
  if (result.error === 'event_not_found') return NextResponse.json({ error: 'Kein aktiver Event gefunden.' }, { status: 404 })
  if (result.error === 'duplicate') return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits angemeldet.', token: result.token }, { status: 409 })
  if (!result.ok) return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })

  try {
    const { data: event } = await db.from('events').select('*').eq('id', result.event_id!).single()
    const { data: registration } = await db.from('registrations').select('*').eq('id', result.id!).single()
    if (event && registration) {
      const emailLang = lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en'
      await sendConfirmationEmail(registration, event, emailLang)
    }
  } catch (emailError) {
    console.error('E-Mail-Fehler:', emailError)
  }

  return NextResponse.json({ token: result.token, id: result.id })
}
