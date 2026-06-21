import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')
  const mid = req.nextUrl.searchParams.get('mid')
  const url = req.nextUrl.searchParams.get('url')

  if (cid && mid) {
    const db = supabaseAdmin()
    await db.from('campaign_events').insert({ campaign_id: cid, member_id: mid, type: 'click' })
  }

  if (url) {
    // Guard against javascript:, data:, and other non-HTTP protocols
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return NextResponse.redirect(url, { status: 302 })
      }
    } catch {
      // invalid URL — fall through
    }
  }

  return new NextResponse('Not found', { status: 404 })
}
