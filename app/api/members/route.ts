import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeAnrede } from '@/lib/anrede'

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

  // A member's own event_id only records which event they were first added
  // under — but Zielgruppen belong to an event too, and a member can be
  // linked (via member_zielgruppen) to a Zielgruppe of a DIFFERENT event than
  // their own (e.g. imported from HubSpot into a new event's Zielgruppe while
  // already existing as a member elsewhere — members.email is globally
  // unique, one row per person). Without this, such a member never shows up
  // in that Zielgruppe's admin view, even though the link exists.
  const { data: zgRows } = await db.from('zielgruppen').select('id').eq('event_id', eventId)
  const zgIds = (zgRows ?? []).map(z => z.id)
  let crossEventMemberIds: string[] = []
  if (zgIds.length) {
    const { data: linkRows } = await db.from('member_zielgruppen').select('member_id').in('zielgruppe_id', zgIds)
    crossEventMemberIds = [...new Set((linkRows ?? []).map(l => l.member_id))]
  }

  let query = db
    .from('members')
    .select('*, invite_codes(code, used), member_zielgruppen(zielgruppe_id)')
    .order('last_name', { ascending: true })
  query = crossEventMemberIds.length
    ? query.or(`event_id.eq.${eventId},id.in.(${crossEventMemberIds.join(',')})`)
    : query.eq('event_id', eventId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const members = (data ?? []).map((m) => {
    const { member_zielgruppen, ...rest } = m as typeof m & { member_zielgruppen: { zielgruppe_id: string }[] }
    return { ...rest, zielgruppe_ids: member_zielgruppen.map((z: { zielgruppe_id: string }) => z.zielgruppe_id) }
  })
  return NextResponse.json(members)
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
    anrede: normalizeAnrede(m.anrede ?? ""),
    sprache: m.sprache ?? null,
  }))
  const emails = rows.map(r => r.email)

  // members.email is globally unique (constraint members_email_key) — one row
  // per person across the whole app, not per event. Look up who already
  // exists first and insert only the genuinely new ones. Existing members are
  // left completely untouched (same as the HubSpot import path) — a re-import
  // must never clobber a manual edit made since the member was first added;
  // it only needs to (re-)link them to this Zielgruppe below.
  const { data: existingRows, error: existingError } = await db.from('members').select('id, email').in('email', emails)
  if (existingError) {
    console.error('[members POST] lookup error:', existingError.message)
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }
  const existingByEmail = new Map((existingRows ?? []).map(m => [m.email, m.id]))

  const newRows = rows.filter(r => !existingByEmail.has(r.email))
  if (newRows.length) {
    const { error: insertError } = await db.from('members').insert(newRows)
    if (insertError) {
      console.error('[members POST] insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  const { data, error: selectError } = await db.from('members').select('id').in('email', emails)
  if (selectError) {
    console.error('[members POST] select error:', selectError.message)
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  if (zielgruppe_id && data && data.length > 0) {
    const junctionRows = data.map((m: { id: string }) => ({ member_id: m.id, zielgruppe_id }))
    const { error: zgError } = await db
      .from('member_zielgruppen')
      .upsert(junctionRows, { onConflict: 'member_id,zielgruppe_id', ignoreDuplicates: true })
    if (zgError) console.error('[members POST] member_zielgruppen upsert error:', zgError.message)
  }

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
  // Get email first so we can clean up globally
  const { data: member } = await db.from('members').select('email').eq('id', id).single()
  // Delete invite codes first
  await db.from('invite_codes').delete().eq('member_id', id)
  const { error } = await db.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (member?.email) {
    // Delete across all events + campaign history
    const { data: otherMembers } = await db.from('members').select('id').eq('email', member.email)
    if (otherMembers && otherMembers.length > 0) {
      await db.from('invite_codes').delete().in('member_id', otherMembers.map((m: {id: string}) => m.id))
    }
    await Promise.all([
      db.from('members').delete().eq('email', member.email),
      db.from('campaign_recipients').delete().eq('email', member.email),
    ])
  }
  return NextResponse.json({ ok: true })
}
