import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function makeCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[b % 32])
    .join('')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, props: any) {
  const { id } = await props.params
  const body = await req.json()

  const pw = req.nextUrl.searchParams.get('adminPassword') ?? body?.adminPassword
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const allowed = ['first_name', 'last_name', 'email', 'zielgruppe_id', 'anrede', 'sprache']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) if (key in body) patch[key] = body[key]
  const { data, error } = await db.from('members').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: existing } = await db.from('invite_codes').select('id').eq('member_id', id).maybeSingle()
  if (!existing) {
    await db.from('invite_codes').insert({ member_id: id, code: makeCode() })
  }

  return NextResponse.json(data)
}
