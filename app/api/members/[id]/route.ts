import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
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

  const _a = checkAdminAuth(req, body)
  if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })

  const db = supabaseAdmin()
  const allowed = ['first_name', 'last_name', 'email', 'anrede', 'sprache']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) if (key in body) patch[key] = body[key]

  if (Object.keys(patch).length > 0) {
    const { error } = await db.from('members').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // A member can belong to several Zielgruppen — { zielgruppe_ids } replaces the
  // full membership set (rather than adding/removing one at a time), so callers
  // just send the desired end state.
  if (Array.isArray(body.zielgruppe_ids)) {
    const { error: delError } = await db.from('member_zielgruppen').delete().eq('member_id', id)
    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
    if (body.zielgruppe_ids.length > 0) {
      const rows = (body.zielgruppe_ids as string[]).map((zielgruppe_id) => ({ member_id: id, zielgruppe_id }))
      const { error: insError } = await db.from('member_zielgruppen').insert(rows)
      if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })
    }
  }

  const { data, error } = await db
    .from('members')
    .select('*, member_zielgruppen(zielgruppe_id)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: existing } = await db.from('invite_codes').select('id').eq('member_id', id).maybeSingle()
  if (!existing) {
    await db.from('invite_codes').insert({ member_id: id, code: makeCode() })
  }

  const { member_zielgruppen, ...rest } = data as typeof data & { member_zielgruppen: { zielgruppe_id: string }[] }
  return NextResponse.json({ ...rest, zielgruppe_ids: member_zielgruppen.map((z: { zielgruppe_id: string }) => z.zielgruppe_id) })
}
