import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(req: NextRequest, body?: Record<string, unknown>): boolean {
  const pw = process.env.ADMIN_PASSWORD
  return (req.nextUrl.searchParams.get('adminPassword') ?? body?.adminPassword) === pw
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json().catch(() => ({}))
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  await db.from('members').update({ zielgruppe_id: null }).eq('zielgruppe_id', id)
  const { error } = await db.from('zielgruppen').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json()
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const db = supabaseAdmin()
  const { data, error } = await db.from('zielgruppen').update({ name: name.trim() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
