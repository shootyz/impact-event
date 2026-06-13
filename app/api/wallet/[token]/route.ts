import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { deflateSync } from 'zlib'

// Pure-JS minimal PNG generator (no canvas/sharp needed)
function createPNG(width: number, height: number, r: number, g: number, b: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 2

  const rowSize = width * 3 + 1
  const raw = Buffer.alloc(height * rowSize)
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0
    for (let x = 0; x < width; x++) {
      raw[y * rowSize + 1 + x * 3] = r
      raw[y * rowSize + 2 + x * 3] = g
      raw[y * rowSize + 3 + x * 3] = b
    }
  }
  const compressed = deflateSync(raw)

  const crc = (buf: Buffer): number => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    let crcVal = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) crcVal = t[(crcVal ^ buf[i]) & 0xFF] ^ (crcVal >>> 8)
    return (crcVal ^ 0xFFFFFFFF) >>> 0
  }

  const chunk = (type: string, data: Buffer): Buffer => {
    const tb = Buffer.from(type)
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const ci = Buffer.concat([tb, data])
    const cv = Buffer.alloc(4); cv.writeUInt32BE(crc(ci))
    return Buffer.concat([len, tb, data, cv])
  }

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Check if Apple Wallet credentials are configured
  const passTypeId = process.env.APPLE_PASS_TYPE_IDENTIFIER
  const teamId = process.env.APPLE_TEAM_IDENTIFIER
  const certB64 = process.env.APPLE_PASS_CERT_B64
  const certPass = process.env.APPLE_PASS_CERT_PASSWORD
  const wwdrB64 = process.env.APPLE_WWDR_CERT_B64

  if (!passTypeId || !teamId || !certB64 || !certPass || !wwdrB64) {
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
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(26, 26, 26)',
    labelColor: 'rgb(180, 180, 180)',
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
    barcode: {
      message: ticketUrl,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: token.substring(0, 8) + '…',
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

    const icon = createPNG(87, 87, 26, 26, 26)
    const icon2x = createPNG(174, 174, 26, 26, 26)
    const logo = createPNG(160, 50, 26, 26, 26)
    const logo2x = createPNG(320, 100, 26, 26, 26)

    const signerCert = Buffer.from(certB64, 'base64')
    const wwdr = Buffer.from(wwdrB64, 'base64')

    const pass = await PKPass.from(
      {
        model: {
          'pass.json': Buffer.from(JSON.stringify(passJson)),
          'icon.png': icon,
          'icon@2x.png': icon2x,
          'logo.png': logo,
          'logo@2x.png': logo2x,
        } as unknown as Record<string, Buffer>,
        certificates: {
          wwdr,
          signerCert,
          signerKey: signerCert,
          signerKeyPassphrase: certPass,
        },
      },
      {}
    )

    const buf = pass.getAsBuffer()

    return new NextResponse(buf, {
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
