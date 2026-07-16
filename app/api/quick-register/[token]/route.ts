import { NextRequest, NextResponse, after } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL!}/?error=rate_limited`)
  }

  const { token } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const lang = req.nextUrl.searchParams.get('lang') ?? ''
  const eventId = req.nextUrl.searchParams.get('event') ?? ''
  const langSuffix = lang && lang !== 'en' ? `?lang=${lang}` : ''
  const db = supabaseAdmin()

  const inviteResult = await db
    .from('invite_codes')
    .select('id, used, members(first_name, last_name, email)')
    .eq('code', token.toUpperCase().trim())
    .single()

  if (inviteResult.error || !inviteResult.data) {
    return NextResponse.redirect(`${appUrl}/${langSuffix}`)
  }

  const eventQuery = eventId
    ? db.from('events').select('*').eq('id', eventId).single()
    : db.from('events').select('*').eq('active', true).order('date', { ascending: true }).limit(1).single()

  const eventResult = await eventQuery
  if (eventResult.error || !eventResult.data) {
    return NextResponse.redirect(`${appUrl}/${langSuffix}`)
  }

  const invite = inviteResult.data
  const event = eventResult.data

  const memberRaw = invite.members
  const member = (Array.isArray(memberRaw) ? memberRaw[0] : memberRaw) as {
    first_name: string; last_name: string; email: string
  } | null

  if (!member) return NextResponse.redirect(`${appUrl}/${langSuffix}`)

  const email = member.email.toLowerCase().trim()
  const name = `${member.first_name} ${member.last_name}`.trim()

  const [byCode, byEmail] = await Promise.all([
    db.from('registrations').select('qr_token').eq('invite_code_id', invite.id).single(),
    db.from('registrations').select('qr_token').eq('email', email).eq('event_id', event.id).single(),
  ])

  if (byCode.data) {
    return NextResponse.redirect(`${appUrl}/success/${byCode.data.qr_token}?already=1${lang ? `&lang=${lang}` : ''}`)
  }
  if (byEmail.data) {
    return NextResponse.redirect(`${appUrl}/success/${byEmail.data.qr_token}?already=1${lang ? `&lang=${lang}` : ''}`)
  }

  // Capacity check (if event has max_capacity set)
  if (event.max_capacity != null) {
    const { count } = await db
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
    if (count != null && count >= event.max_capacity) {
      return NextResponse.redirect(`${appUrl}/?capacity_full=1${langSuffix ? `&${langSuffix.slice(1)}` : ''}`)
    }
  }

  const qrToken = randomUUID()
  const { data: registration, error: regError } = await db
    .from('registrations')
    .insert({ name, email, event_id: event.id, qr_token: qrToken, checked_in: false, invite_code_id: invite.id })
    .select()
    .single()

  if (regError || !registration) {
    return NextResponse.redirect(`${appUrl}/${langSuffix}`)
  }

  const emailLang = lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en'
  after(async () => {
    await db.from('invite_codes').update({ used: true }).eq('id', invite.id)
    try {
      await sendConfirmationEmail(registration, event, emailLang)
    } catch (e) {
      console.error('Ticket email failed:', e)
    }
  })

  return NextResponse.redirect(`${appUrl}/success/${qrToken}${lang ? `?lang=${lang}` : ''}`)
}
