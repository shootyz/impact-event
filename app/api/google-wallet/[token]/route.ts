import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isTicketTokenExpired } from '@/lib/ticketToken'
import { buildGoogleWalletSaveUrl, isGoogleWalletConfigured } from '@/lib/googleWallet'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!isGoogleWalletConfigured()) {
    return NextResponse.json({ error: 'Google Wallet not configured.' }, { status: 503 })
  }

  const db = supabaseAdmin()
  const { data: reg } = await db
    .from('registrations')
    .select('*, events(*)')
    .eq('qr_token', token)
    .single()

  if (!reg) return NextResponse.json({ error: 'Ticket nicht gefunden.' }, { status: 404 })

  const event = reg.events as { id: string; name: string; date: string; location: string }
  if (isTicketTokenExpired(event.date)) {
    return NextResponse.json({ error: 'Dieser Ticket-Link ist abgelaufen.' }, { status: 410 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const ticketUrl = `${appUrl}/ticket/${token}`

  const saveUrl = buildGoogleWalletSaveUrl({
    eventId: event.id,
    eventName: event.name,
    eventDateIso: new Date(event.date).toISOString(),
    eventLocation: event.location,
    registrationId: reg.id,
    holderName: reg.name,
    qrValue: ticketUrl,
  })

  if (!saveUrl) return NextResponse.json({ error: 'Google Wallet not configured.' }, { status: 503 })

  return NextResponse.redirect(saveUrl)
}
