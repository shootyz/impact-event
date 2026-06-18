import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { adminPassword, name, date, location, description, registration_password } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  if (!name?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: 'Name, Datum und Ort sind erforderlich.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin()
    .from('events')
    .insert({
      name: name.trim(),
      date,
      location: location.trim(),
      description: description?.trim() || null,
      registration_password: registration_password?.trim() || null,
      active: true,
    })
    .select()
    .single()

  if (error || !data) {
    console.error(error)
    return NextResponse.json({ error: 'Fehler beim Erstellen.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
