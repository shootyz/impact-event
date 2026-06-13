import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const { adminPassword } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data: event } = await db.from('events').select('id').eq('active', true).single()
  if (!event) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })

  const { count } = await db
    .from('registrations')
    .delete({ count: 'exact' })
    .eq('event_id', event.id)

  return NextResponse.json({ deleted: count })
}
