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

  if (data && data.length > 0) {
    const codes = data.map((m: { id: string }) => ({
      member_id: m.id,
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    }))
    await db.from('invite_codes').upsert(codes, { onConflict: 'member_id', ignoreDuplicates: true })
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
