import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')
  const mid = req.nextUrl.searchParams.get('mid')

  if (cid && mid) {
    const db = supabaseAdmin()
    // Only count first open per member per campaign
    const { data: existing } = await db
      .from('campaign_events')
      .select('id')
      .eq('campaign_id', cid)
      .eq('member_id', mid)
      .eq('type', 'open')
      .maybeSingle()

    if (!existing) {
      await db.from('campaign_events').insert({ campaign_id: cid, member_id: mid, type: 'open' })
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  })
}
