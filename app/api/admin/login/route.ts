import { NextRequest, NextResponse } from 'next/server'
import { passwordsMatch, signSessionToken, SESSION_TTL_MS } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

// Exchanges the raw admin password for a time-limited session token, so the
// browser only needs to hold the real secret for this one request instead of
// forever (see lib/auth.ts for why).
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!passwordsMatch(password, expected)) {
    return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 })
  }

  const expiresAt = Date.now() + SESSION_TTL_MS
  return NextResponse.json({ token: signSessionToken(expiresAt), expiresAt })
}
