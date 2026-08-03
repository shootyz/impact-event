import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Supabase's free tier auto-pauses a project after 7 days with no API activity.
// This runs daily (see vercel.json) and does one trivial query so the project
// never crosses that inactivity threshold.
export async function GET(req: NextRequest) {
  // Vercel Cron authenticates via CRON_SECRET header
  const authHeader = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  const { timingSafeEqual } = await import('crypto')
  const match = authHeader.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  if (!match) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin().from('events').select('id').limit(1)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() })
}
