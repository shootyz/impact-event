import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { rateLimit } from './rate-limit'

function passwordsMatch(candidate: string, expected: string): boolean {
  try {
    const a = Buffer.from(candidate, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    // timingSafeEqual requires equal-length buffers
    if (a.length !== b.length) {
      // Still do a dummy compare to avoid length-based timing leak
      timingSafeEqual(b, b)
      return false
    }
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Checks adminPassword from query param or request body.
 * Also applies rate limiting (20 req/min per IP) to block brute-force.
 * Returns 'ok' | 'rate_limited' | 'unauthorized'
 */
export function checkAdminAuth(
  req: NextRequest,
  body?: Record<string, unknown>
): 'ok' | 'rate_limited' | 'unauthorized' {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 20, windowMs: 60_000 })) return 'rate_limited'

  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return 'unauthorized'

  const candidate =
    req.nextUrl.searchParams.get('adminPassword') ??
    req.nextUrl.searchParams.get('password') ??
    (body?.adminPassword as string | undefined) ??
    (body?.password as string | undefined) ??
    ''

  return passwordsMatch(candidate, expected) ? 'ok' : 'unauthorized'
}

/** Convenience: returns true if auth passes, false otherwise (no rate limit distinction). */
export function isAdminAuthed(req: NextRequest, body?: Record<string, unknown>): boolean {
  return checkAdminAuth(req, body) === 'ok'
}
