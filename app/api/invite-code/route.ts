import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('invite_codes')
    .select('id, used, members(first_name, last_name, email)')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  if (data.used) return NextResponse.json({ error: 'Code already used' }, { status: 409 })

  const memberRaw = data.members
  const member = (Array.isArray(memberRaw) ? memberRaw[0] : memberRaw) as { first_name: string; last_name: string; email: string } | null
  return NextResponse.json({
    valid: true,
    id: data.id,
    name: member ? `${member.first_name} ${member.last_name}` : null,
    email: member?.email ?? null,
  })
}
