import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(req: NextRequest, body?: Record<string, unknown>): boolean {
  const pw = process.env.ADMIN_PASSWORD
  return (req.nextUrl.searchParams.get('adminPassword') ?? body?.adminPassword) === pw
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('zielgruppen')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(req, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, event_id } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  const db = supabaseAdmin()
  const { data, error } = await db.from('zielgruppen').insert({ name: name.trim(), event_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
