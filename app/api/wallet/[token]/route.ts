import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isTicketTokenExpired } from '@/lib/ticketToken'
import { WALLET_IMAGES } from '@/lib/wallet-assets'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Check if Apple Wallet credentials are configured
  const passTypeId = process.env.APPLE_PASS_TYPE_IDENTIFIER
  const teamId = process.env.APPLE_TEAM_IDENTIFIER
  const certB64 = process.env.APPLE_PASS_CERT_B64
  const keyB64 = process.env.APPLE_PASS_KEY_B64
  const certPass = process.env.APPLE_PASS_CERT_PASSWORD
  const wwdrB64 = process.env.APPLE_WWDR_CERT_B64

  if (!passTypeId || !teamId || !certB64 || !keyB64 || !certPass || !wwdrB64) {
    return NextResponse.json({ error: 'Apple Wallet not configured.' }, { status: 503 })
  }

  const db = supabaseAdmin()
  const { data: reg } = await db
    .from('registrations')
    .select('*, events(*)')
    .eq('qr_token', token)
    .single()

  if (!reg) return NextResponse.json({ error: 'Ticket nicht gefunden.' }, { status: 404 })

  const event = reg.events as { name: string; date: string; location: string }
  if (isTicketTokenExpired(event.date)) {
    return NextResponse.json({ error: 'Dieser Ticket-Link ist abgelaufen.' }, { status: 410 })
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const ticketUrl = `${appUrl}/ticket/${token}`

  const eventDate = new Date(event.date).toLocaleDateString('de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    serialNumber: token,
    teamIdentifier: teamId,
    organizationName: 'Impact Gstaad',
    description: event.name,
    // Impact Gstaad brand colors (see app/globals.css --ig-navy / --ig-gold)
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(30, 50, 99)',
    labelColor: 'rgb(210, 141, 40)',
    eventTicket: {
      primaryFields: [{ key: 'event', label: 'EVENT', value: event.name }],
      secondaryFields: [
        { key: 'date', label: 'DATE', value: eventDate },
        { key: 'location', label: 'LOCATION', value: event.location },
      ],
      auxiliaryFields: [
        { key: 'holder', label: 'NAME', value: reg.name },
      ],
    },
    barcodes: [
      {
        message: ticketUrl,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: token.substring(0, 8) + '…',
      },
    ],
  }

  try {
    const { PKPass } = await import('passkit-generator')

    // Real logo, pre-baked onto a white tile (see scripts/generate-wallet-assets.mjs) —
    // the logo's navy text would be invisible directly on the pass's navy
    // backgroundColor otherwise, same failure mode as the flat placeholder before it.
    const icon = Buffer.from(WALLET_IMAGES.icon1x, 'base64')
    const icon2x = Buffer.from(WALLET_IMAGES.icon2x, 'base64')
    const icon3x = Buffer.from(WALLET_IMAGES.icon3x, 'base64')
    const logo = Buffer.from(WALLET_IMAGES.logo1x, 'base64')
    const logo2x = Buffer.from(WALLET_IMAGES.logo2x, 'base64')
    const logo3x = Buffer.from(WALLET_IMAGES.logo3x, 'base64')

    // passkit-generator needs PEM cert + PEM key as SEPARATE values (not the
    // raw .p12 buffer used for both, which silently fails signing) — see
    // scripts/p12-to-pem.js for how these two env vars get generated.
    const signerCert = Buffer.from(certB64, 'base64')
    const signerKey = Buffer.from(keyB64, 'base64')
    const wwdr = Buffer.from(wwdrB64, 'base64')

    const buffers = {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
      'icon.png': icon,
      'icon@2x.png': icon2x,
      'icon@3x.png': icon3x,
      'logo.png': logo,
      'logo@2x.png': logo2x,
      'logo@3x.png': logo3x,
    }
    const certificates = { wwdr, signerCert, signerKey, signerKeyPassphrase: certPass }

    // new PKPass(...), not PKPass.from(...) — .from() expects an existing
    // PKPass instance or a { model: <disk path> } Template, not in-memory
    // buffers, which is what we need in a serverless function.
    const pass = new PKPass(buffers, certificates)

    const buf = pass.getAsBuffer()

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="ticket-${token.substring(0, 8)}.pkpass"`,
      },
    })
  } catch (err) {
    console.error('Wallet error:', err)
    return NextResponse.json({ error: 'Wallet-Generierung fehlgeschlagen.' }, { status: 500 })
  }
}
