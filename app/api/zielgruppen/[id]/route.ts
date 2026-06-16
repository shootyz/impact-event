import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: NextRequest, props: any) {
  const { id } = await props.params
  const db = supabaseAdmin()
  // unlink members before deleting
  await db.from('members').update({ zielgruppe_id: null }).eq('zielgruppe_id', id)
  const { error } = await db.from('zielgruppen').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, props: any) {
  const { id } = await props.params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const db = supabaseAdmin()
  const { data, error } = await db.from('zielgruppen').update({ name: name.trim() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
