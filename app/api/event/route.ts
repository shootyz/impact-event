import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const slug = req.nextUrl.searchParams.get('slug')
  const base = supabase()
    .from('events')
    .select('id, name, date, location, description, registration_password, registration_type, max_capacity, form_config')
  const { data: event, error } = await (
    id ? base.eq('id', id) :
    slug ? base.eq('slug', slug) :
    base.eq('active', true)
  ).single()

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
      registration_type: event.registration_type ?? 'invite',
      max_capacity: event.max_capacity ?? null,
      form_config: event.form_config ?? null,
    },
    {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    }
  )
}
