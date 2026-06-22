import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const db = supabaseAdmin()

  // Find the email belonging to this token
  const { data: member } = await db
    .from('members')
    .select('email')
    .eq('unsubscribe_token', token)
    .single()

  if (!member) return NextResponse.redirect(new URL('/unsubscribe?success=1', req.url))

  // Unsubscribe globally — all member rows with this email across all events
  const { error } = await db
    .from('members')
    .update({ unsubscribed: true })
    .eq('email', member.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.redirect(new URL('/unsubscribe?success=1', req.url))
}
