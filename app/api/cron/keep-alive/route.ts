import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Supabase's free tier auto-pauses a project after 7 days with no API activity.
// This runs daily (see vercel.json) and does one trivial query so the project
// never crosses that inactivity threshold.
//
// Also archives events whose date has passed but are still flagged active=true.
// A stale active event silently coexists with the real one, and any lookup that
// resolves "the active event" without an explicit eventId then picks whichever
// is earliest — landing on the stale one (root cause of several past bugs).
export async function GET(req: NextRequest) {
  // Vercel Cron authenticates via CRON_SECRET header
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const authHeader = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${cronSecret}`
  const { timingSafeEqual } = await import('crypto')
  const match = authHeader.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  if (!match) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin().from('events').select('id').limit(1)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const { data: archived, error: archiveError } = await supabaseAdmin()
    .from('events')
    .update({ active: false })
    .eq('active', true)
    .lt('date', new Date().toISOString())
    .select('id, name')
  if (archiveError) return NextResponse.json({ ok: false, error: archiveError.message }, { status: 500 })

  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString(), archived: archived?.length ?? 0, events: archived ?? [] })
}
