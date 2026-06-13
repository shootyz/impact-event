import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('active', true)
    .single()

  if (!event) {
    return NextResponse.json({ registrations: [], event: null })
  }

  const { data: registrations } = await db
    .from('registrations')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ registrations: registrations || [], event })
}
