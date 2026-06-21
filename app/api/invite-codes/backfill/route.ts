import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function makeCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[b % 32])
    .join('')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const _a = checkAdminAuth(req, body ?? {}); if (_a !== 'ok') { return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 }) }

  const db = supabaseAdmin()
  const { data: members } = await db.from('members').select('id')
  if (!members) return NextResponse.json({ error: 'No members' }, { status: 500 })

  const { data: existing } = await db.from('invite_codes').select('member_id')
  const existingIds = new Set((existing ?? []).map(e => e.member_id))

  const missing = members.filter(m => !existingIds.has(m.id))
  if (missing.length === 0) return NextResponse.json({ backfilled: 0 })

  const codes = missing.map(m => ({ member_id: m.id, code: makeCode() }))
  const { error } = await db.from('invite_codes').insert(codes)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ backfilled: codes.length })
}
