import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json()
  const db = supabaseAdmin()
  const allowed = ['first_name', 'last_name', 'email', 'zielgruppe_id']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) if (key in body) patch[key] = body[key]
  const { data, error } = await db.from('members').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
