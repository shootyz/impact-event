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

  // Look up invite code + member
  const { data: invite, error: inviteError } = await db
    .from('invite_codes')
    .select('id, used, members(first_name, last_name, email)')
    .eq('code', token.toUpperCase().trim())
    .single()

  if (inviteError || !invite) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_code`)
  }

  const memberRaw = invite.members
  const member = (Array.isArray(memberRaw) ? memberRaw[0] : memberRaw) as {
    first_name: string
    last_name: string
    email: string
  } | null

  if (!member) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_code`)
  }

  // Get active event
  const { data: event, error: eventError } = await db
    .from('events')
    .select('*')
    .eq('active', true)
    .single()

  if (eventError || !event) {
    return NextResponse.redirect(`${appUrl}/?error=no_event`)
  }

  const email = member.email.toLowerCase().trim()
  const name = `${member.first_name} ${member.last_name}`.trim()

  // Check if already registered by invite_code_id (most reliable)
  const { data: byCode } = await db
    .from('registrations')
    .select('qr_token')
    .eq('invite_code_id', invite.id)
    .single()

  if (byCode) {
    return NextResponse.redirect(`${appUrl}/success/${byCode.qr_token}?already=1`)
  }

  // Fallback: check by email + event
  const { data: byEmail } = await db
    .from('registrations')
    .select('qr_token')
    .eq('email', email)
    .eq('event_id', event.id)
    .single()

  if (byEmail) {
    return NextResponse.redirect(`${appUrl}/success/${byEmail.qr_token}?already=1`)
  }

  // If code used but no registration found, reset used flag and let them register
  if (invite.used) {
    await db.from('invite_codes').update({ used: false }).eq('id', invite.id)
  }

  // Create registration
  const qrToken = randomUUID()
  const { data: registration, error: regError } = await db
    .from('registrations')
    .insert({
      name,
      email,
      event_id: event.id,
      qr_token: qrToken,
      checked_in: false,
      invite_code_id: invite.id,
    })
    .select()
    .single()

  if (regError || !registration) {
    return NextResponse.redirect(`${appUrl}/?code=${token}`)
  }

  // Mark code as used
  await db.from('invite_codes').update({ used: true }).eq('id', invite.id)

  // Send ticket email after redirect (non-blocking)
  after(async () => {
    try {
      await sendConfirmationEmail(registration, event)
    } catch (e) {
      console.error('Ticket email failed:', e)
    }
  })

  return NextResponse.redirect(`${appUrl}/success/${qrToken}`)
}
