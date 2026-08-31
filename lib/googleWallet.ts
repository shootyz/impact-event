import { createSign } from 'crypto'

// Google Wallet's "Add to Google Wallet" flow needs no server-to-server API
// call to pre-create anything — the ticket class + object are embedded
// directly in a signed JWT, and Google creates/updates them when the user
// taps "save". Just needs an RS256-signed JWT with the service account's
// private key, which Node's own crypto module can do without a JWT library.

type ServiceAccountCreds = { client_email: string; private_key: string }

function getCredentials(): ServiceAccountCreds | null {
  const b64 = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_B64
  if (!b64) return null
  try {
    const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
    if (!parsed.client_email || !parsed.private_key) return null
    return parsed
  } catch {
    return null
  }
}

function signJwt(payload: object, creds: ServiceAccountCreds): string {
  const header = { alg: 'RS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = createSign('RSA-SHA256').update(signingInput).sign(creds.private_key)
  return `${signingInput}.${signature.toString('base64url')}`
}

export function isGoogleWalletConfigured(): boolean {
  return !!getCredentials() && !!process.env.GOOGLE_WALLET_ISSUER_ID
}

export function buildGoogleWalletSaveUrl(params: {
  eventId: string
  eventName: string
  eventDateIso: string
  eventLocation: string
  registrationId: string
  holderName: string
  qrValue: string
}): string | null {
  const creds = getCredentials()
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  if (!creds || !issuerId) return null

  const classId = `${issuerId}.event_${params.eventId}`
  const objectId = `${issuerId}.reg_${params.registrationId}`

  const eventTicketClass = {
    id: classId,
    issuerName: 'Impact Gstaad',
    eventName: { defaultValue: { language: 'de', value: params.eventName } },
    // Account is in Demo mode until Google grants publish access — classes
    // created inline stay reviewable/testable under this status until then.
    reviewStatus: 'UNDER_REVIEW',
    venue: {
      name: { defaultValue: { language: 'de', value: params.eventLocation } },
      address: { defaultValue: { language: 'de', value: params.eventLocation } },
    },
    dateTime: { start: params.eventDateIso },
    hexBackgroundColor: '#F8F9FF',
  }

  const eventTicketObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    ticketHolderName: params.holderName,
    barcode: { type: 'QR_CODE', value: params.qrValue },
  }

  const payload = {
    iss: creds.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      eventTicketClasses: [eventTicketClass],
      eventTicketObjects: [eventTicketObject],
    },
  }

  return `https://pay.google.com/gp/v/save/${signJwt(payload, creds)}`
}
