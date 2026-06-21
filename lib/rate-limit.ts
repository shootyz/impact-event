// Simple in-memory rate limiter (per Vercel function instance)
// Good enough for spam protection on public endpoints at this scale.

const hits = new Map<string, number[]>()

export function rateLimit(ip: string, opts: { max: number; windowMs: number }): boolean {
  const now = Date.now()
  const windowStart = now - opts.windowMs
  const prev = (hits.get(ip) ?? []).filter(t => t > windowStart)
  if (prev.length >= opts.max) return false
  hits.set(ip, [...prev, now])
  return true
}

// Clean up old entries every ~5 min to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - 60_000 * 10
  for (const [key, times] of hits.entries()) {
    if (times.every(t => t < cutoff)) hits.delete(key)
  }
}, 60_000 * 5)
