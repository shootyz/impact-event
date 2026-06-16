import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: NextRequest, props: any) {
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
