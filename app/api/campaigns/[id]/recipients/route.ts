import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id } = await props.params
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('campaign_recipients')
    .select('email, first_name, last_name')
    .eq('campaign_id', id)
    .order('last_name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
