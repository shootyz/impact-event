import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const db = supabaseAdmin()
  const { error } = await db
    .from('members')
    .update({ unsubscribed: true })
    .eq('unsubscribe_token', token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.redirect(new URL('/unsubscribe?success=1', req.url))
}
