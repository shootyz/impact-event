import { timingSafeEqual, createHmac } from 'crypto'
import type { NextRequest } from 'next/server'
import { rateLimit } from './rate-limit'

export function passwordsMatch(candidate: string, expected: string): boolean {
  try {
    const a = Buffer.from(candidate, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) { timingSafeEqual(b, b); return false }
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// The admin login session was previously just the raw shared ADMIN_PASSWORD,
// kept in the browser's sessionStorage forever with no expiry — so a leaked
// tab (or an XSS reading sessionStorage) meant permanent full admin access
// until someone thought to rotate the password. Login now mints a signed,
// time-limited session token instead; the browser never needs to hold onto
// the raw password after the initial login request.
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

function sign(payload: string): string {
  const key = process.env.ADMIN_PASSWORD ?? ''
  return createHmac('sha256', key).update(payload).digest('base64url')
}

export function signSessionToken(expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt }), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifySessionToken(token: string): boolean {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  if (!passwordsMatch(sig, sign(payload))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

// Password accepted from:
// 1. Authorization: Bearer <password-or-session-token> header  (preferred — not logged in URLs)
// 2. Request body: { adminPassword } or { password }
// Query params are intentionally NOT accepted (URL logs in Vercel/CDN would expose the secret)
export function checkAdminAuth(
  req: NextRequest,
  body?: Record<string, unknown>
): 'ok' | 'rate_limited' | 'unauthorized' {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 20, windowMs: 60_000 })) return 'rate_limited'

  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return 'unauthorized'

  const authHeader = req.headers.get('authorization') ?? ''
  const candidate =
    (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
    (body?.adminPassword as string | undefined) ||
    (body?.password as string | undefined) ||
    ''

  if (candidate.includes('.') && verifySessionToken(candidate)) return 'ok'
  return passwordsMatch(candidate, expected) ? 'ok' : 'unauthorized'
}

export function isAdminAuthed(req: NextRequest, body?: Record<string, unknown>): boolean {
  return checkAdminAuth(req, body) === 'ok'
}

// Scanner PIN — grants access to scan + manual registration only (not full admin)
// Accepted from: request body { scannerPin } or x-scanner-pin header (for GET requests)
export function isScannerAuthed(body?: Record<string, unknown>, req?: NextRequest): boolean {
  const pin = process.env.SCANNER_PIN
  if (!pin) return false
  const candidate =
    (body?.scannerPin as string | undefined) ||
    req?.headers.get('x-scanner-pin') ||
    ''
  return passwordsMatch(candidate, pin)
}

// Accepts either admin password OR scanner PIN
export function isScannerOrAdminAuthed(req: NextRequest, body?: Record<string, unknown>): boolean {
  return isAdminAuthed(req, body) || isScannerAuthed(body)
}
