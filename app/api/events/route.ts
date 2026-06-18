import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase()
    .from('events')
    .select('id, name, date')
    .eq('active', true)
    .order('date', { ascending: true })
  return NextResponse.json(data ?? [])
}
