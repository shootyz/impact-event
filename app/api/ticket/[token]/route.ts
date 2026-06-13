import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { data } = await supabaseAdmin()
    .from('registrations')
    .select('name, events(name, date, location)')
    .eq('qr_token', token)
    .single()

  if (!data) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  return NextResponse.json({
    name: data.name,
    event: data.events,
  })
}
