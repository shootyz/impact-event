import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('members')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { members } = await req.json()
  // members: Array<{ first_name, last_name, email }>
  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: 'No members provided' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const rows = members.map((m: { first_name: string; last_name: string; email: string }) => ({
    first_name: m.first_name.trim(),
    last_name: m.last_name.trim(),
    email: m.email.toLowerCase().trim(),
  }))

  const { data, error } = await db
    .from('members')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: false })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data?.length ?? 0 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const db = supabaseAdmin()
  const { error } = await db.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
