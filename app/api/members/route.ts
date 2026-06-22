import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function makeCode(): string {
  // 8-char alphanumeric — ~2.8 trillion combinations, collision-safe for any realistic scale
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[b % 32])
    .join('')
}

export async function GET(req: NextRequest) {
  const _a = checkAdminAuth(req); if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })
  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('members')
    .select('*, invite_codes(code, used)')
    .eq('event_id', eventId)
    .order('last_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const _a = checkAdminAuth(req, body ?? {}); if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })

  const { members, zielgruppe_id, event_id } = body
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: 'No members provided' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const rows = members.map((m: { first_name: string; last_name: string; email: string; anrede?: string | null; sprache?: string | null }) => ({
    first_name: m.first_name.trim(),
    last_name: m.last_name.trim(),
    email: m.email.toLowerCase().trim(),
    event_id,
    ...(zielgruppe_id ? { zielgruppe_id } : {}),
    anrede: m.anrede ?? "",
    sprache: m.sprache ?? null,
  }))

  const { data, error } = await db
    .from('members')
    .upsert(rows, { onConflict: 'email,event_id', ignoreDuplicates: false })
    .select()

  if (error) {
    console.error('[members POST] upsert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Explicitly update sprache + anrede (upsert may not override with null)
  const updateResults = await Promise.all(rows.map(m =>
    db.from('members')
      .update({ sprache: m.sprache, anrede: m.anrede, ...(zielgruppe_id ? { zielgruppe_id } : {}) })
      .eq('email', m.email)
      .eq('event_id', event_id)
  ))
  const updateErrors = updateResults.filter(r => r.error).map(r => r.error?.message)
  if (updateErrors.length > 0) console.error('[members POST] update errors:', updateErrors)

  // Generate invite codes for members that don't have one yet
  const { data: allMembers } = await db.from('members').select('id').eq('event_id', event_id)
  if (allMembers && allMembers.length > 0) {
    const { data: existingCodes } = await db
      .from('invite_codes')
      .select('member_id')
      .in('member_id', allMembers.map((m: { id: string }) => m.id))

    const existingIds = new Set((existingCodes ?? []).map((c: { member_id: string }) => c.member_id))
    const missing = allMembers.filter((m: { id: string }) => !existingIds.has(m.id))

    if (missing.length > 0) {
      const codes = missing.map((m: { id: string }) => ({ member_id: m.id, event_id, code: makeCode() }))
      const { error: codeError } = await db.from('invite_codes').insert(codes)
      if (codeError) console.error('invite_codes insert error:', codeError.message)
    }
  }

  return NextResponse.json({ inserted: data?.length ?? 0 })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const _a = checkAdminAuth(req, body ?? {}); if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })
  const { id } = body
  const db = supabaseAdmin()
  const { error } = await db.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
