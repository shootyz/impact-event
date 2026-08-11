import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { T, type Lang } from '@/lib/i18n'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const body = await req.json()
  const lang: Lang = body.lang === 'de' || body.lang === 'fr' ? body.lang : 'en'
  const t = T[lang]

  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: t.errorTooManyRequests }, { status: 429 })
  }

  const { name, email, invite_code_id, invite_code, event_id } = body

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: `${t.errorName} ${t.errorEmail}` }, { status: 400 })
  }

  const db = supabaseAdmin()
  let resolvedInviteCodeId: string | null = invite_code_id ?? null

  // Verify the event is invite-type and that the invite code actually belongs
  // to this event — prevents registering without a valid code or cross-event code reuse
  if (event_id) {
    const { data: event } = await db
      .from('events')
      .select('registration_type')
      .eq('id', event_id)
      .single()

    if (event?.registration_type === 'invite') {
      // A manually-typed code (no personalized link) resolves by its code string
      if (!resolvedInviteCodeId && invite_code?.trim()) {
        const { data: byCode } = await db
          .from('invite_codes')
          .select('id')
          .eq('code', invite_code.trim().toUpperCase())
          .single()
        resolvedInviteCodeId = byCode?.id ?? null
        // A code was typed but doesn't exist — that's "invalid", not "missing"
        if (!resolvedInviteCodeId) {
          return NextResponse.json({ error: t.errorInviteCodeInvalid }, { status: 400 })
        }
      }

      if (!resolvedInviteCodeId) {
        return NextResponse.json({ error: t.errorInviteCodeRequired }, { status: 400 })
      }
      // Confirm code belongs to this event and is unused
      const { data: code } = await db
        .from('invite_codes')
        .select('id, used, members(event_id)')
        .eq('id', resolvedInviteCodeId)
        .single()

      const memberEventId = code
        ? (Array.isArray(code.members) ? code.members[0] : code.members as { event_id: string } | null)?.event_id
        : null

      if (!code || code.used || memberEventId !== event_id) {
        return NextResponse.json({ error: t.errorInviteCodeInvalid }, { status: 400 })
      }
    }
  }

  const { data, error: rpcError } = await db.rpc('register_invite_atomic', {
    p_event_id: event_id ?? null,
    p_name: name.trim(),
    p_email: email.toLowerCase().trim(),
    p_invite_code_id: resolvedInviteCodeId,
  })

  if (rpcError) {
    console.error(rpcError)
    return NextResponse.json({ error: t.errorRegistrationFailed }, { status: 500 })
  }

  const result = data as { ok?: boolean; error?: string; token?: string; id?: string; event_id?: string }
  if (result.error === 'event_not_found') return NextResponse.json({ error: t.errorEventNotFound }, { status: 404 })
  if (result.error === 'duplicate') return NextResponse.json({ error: t.errorDuplicateEmail, token: result.token }, { status: 409 })
  if (!result.ok) return NextResponse.json({ error: t.errorRegistrationFailed }, { status: 500 })

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
