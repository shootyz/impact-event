import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Proxies Nominatim server-side — the browser can't call nominatim.openstreetmap.org
// directly anymore because it stopped sending Access-Control-Allow-Origin (CORS block).
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })

  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
    headers: { 'Accept-Language': 'de', 'User-Agent': 'ImpactGstaad/1.0 (https://impactgstaad.vercel.app)' },
  })
  const data = await res.json()
  const [first] = data ?? []
  if (!first) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  return NextResponse.json({ lat: first.lat, lon: first.lon })
}
