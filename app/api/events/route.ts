import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin()
    .from('events')
    .select('id, name, date')
    .eq('active', true)
    .order('date', { ascending: true })
  return NextResponse.json(data ?? [])
}
