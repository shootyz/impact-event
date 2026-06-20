import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const db = supabaseAdmin()

  const { data: members } = await db.from('members').select('id')
  if (!members) return NextResponse.json({ error: 'No members' }, { status: 500 })

  const { data: existing } = await db.from('invite_codes').select('member_id')
  const existingIds = new Set((existing ?? []).map(e => e.member_id))

  const missing = members.filter(m => !existingIds.has(m.id))
  if (missing.length === 0) return NextResponse.json({ backfilled: 0 })

  const codes = missing.map(m => ({
    member_id: m.id,
    code: Math.random().toString(36).slice(2, 8).toUpperCase(),
  }))

  const { error } = await db.from('invite_codes').insert(codes)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ backfilled: codes.length })
}
