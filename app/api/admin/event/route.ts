import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const { adminPassword, registration_password } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: event } = await db
    .from('events')
    .select('id')
    .eq('active', true)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  await db
    .from('events')
    .update({ registration_password: registration_password || null })
    .eq('id', event.id)

  return NextResponse.json({ ok: true })
}
