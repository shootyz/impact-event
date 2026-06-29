import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { timingSafeEqual } from 'crypto'

function pinsMatch(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8'), bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) { timingSafeEqual(bb, bb); return false }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 }))
    return NextResponse.json({ error: 'Zu viele Versuche.' }, { status: 429 })

  const { eventId, pin } = await req.json()
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 })

  const db = supabaseAdmin()
  const { data } = await db.from('events').select('scanner_pin').eq('id', eventId).single()
  if (!data?.scanner_pin) return NextResponse.json({ ok: true, pinRequired: false })

  return NextResponse.json({ ok: pinsMatch(pin, data.scanner_pin) })
}
