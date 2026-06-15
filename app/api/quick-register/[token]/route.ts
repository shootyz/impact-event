import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const db = supabaseAdmin()

  // Invite code + active event in parallel
  const [inviteResult, eventResult] = await Promise.all([
    db.from('invite_codes')
      .select('id, used, members(first_name, last_name, email)')
      .eq('code', token.toUpperCase().trim())
      .single(),
    db.from('events').select('*').eq('active', true).single(),
  ])

  if (inviteResult.error || !inviteResult.data) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_code`)
  }
  if (eventResult.error || !eventResult.data) {
    return NextResponse.redirect(`${appUrl}/?error=no_event`)
  }

  const invite = inviteResult.data
  const event = eventResult.data

  const memberRaw = invite.members
  const member = (Array.isArray(memberRaw) ? memberRaw[0] : memberRaw) as {
    first_name: string; last_name: string; email: string
  } | null

  if (!member) return NextResponse.redirect(`${appUrl}/?error=invalid_code`)

  const email = member.email.toLowerCase().trim()
  const name = `${member.first_name} ${member.last_name}`.trim()

  // Both registration checks in parallel
  const [byCode, byEmail] = await Promise.all([
    db.from('registrations').select('qr_token').eq('invite_code_id', invite.id).single(),
    db.from('registrations').select('qr_token').eq('email', email).eq('event_id', event.id).single(),
  ])

  if (byCode.data) {
    return NextResponse.redirect(`${appUrl}/success/${byCode.data.qr_token}?already=1`)
  }
  if (byEmail.data) {
    return NextResponse.redirect(`${appUrl}/success/${byEmail.data.qr_token}?already=1`)
  }

  // Create registration
  const qrToken = randomUUID()
  const { data: registration, error: regError } = await db
    .from('registrations')
    .insert({ name, email, event_id: event.id, qr_token: qrToken, checked_in: false, invite_code_id: invite.id })
    .select()
    .single()

  if (regError || !registration) {
    return NextResponse.redirect(`${appUrl}/?code=${token}`)
  }

  // Mark used + send email after redirect (non-blocking)
  after(async () => {
    await db.from('invite_codes').update({ used: true }).eq('id', invite.id)
    try {
      await sendConfirmationEmail(registration, event)
    } catch (e) {
      console.error('Ticket email failed:', e)
    }
  })

  return NextResponse.redirect(`${appUrl}/success/${qrToken}`)
}
