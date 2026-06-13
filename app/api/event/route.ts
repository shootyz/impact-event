import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: event, error } = await supabase()
    .from('events')
    .select('id, name, date, location, description')
    .eq('active', true)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  return NextResponse.json(event)
}
