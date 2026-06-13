import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: event, error } = await supabase()
    .from('events')
    .select('id, name, date, location, description, registration_password')
    .eq('active', true)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  return NextResponse.json(
    {
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      registration_password: !!event.registration_password,
    },
    {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    }
  )
}
