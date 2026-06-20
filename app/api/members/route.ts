import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Explicitly update sprache + anrede for each imported member (upsert may not override with null)
  await Promise.all(rows.map(m =>
    db.from('members')
      .update({ sprache: m.sprache, anrede: m.anrede })
      .eq('email', m.email)
      .eq('event_id', event_id)
  ))

  // Generate invite codes for ALL members in this event that don't have one yet
  const { data: allMembers } = await db
    .from('members')
    .select('id')
    .eq('event_id', event_id)

  if (allMembers && allMembers.length > 0) {
    const { data: existingCodes } = await db
      .from('invite_codes')
      .select('member_id')
      .in('member_id', allMembers.map((m: { id: string }) => m.id))

    const existingIds = new Set((existingCodes ?? []).map((c: { member_id: string }) => c.member_id))
    const missing = allMembers.filter((m: { id: string }) => !existingIds.has(m.id))

    if (missing.length > 0) {
      const codes = missing.map((m: { id: string }) => ({
        member_id: m.id,
        event_id,
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
      }))
      const { error: codeError } = await db.from('invite_codes').insert(codes)
      if (codeError) console.error('invite_codes insert error:', codeError.message)
    }
  }

  return NextResponse.json({ inserted: data?.length ?? 0 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const db = supabaseAdmin()
  const { error } = await db.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
