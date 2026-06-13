import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { token, adminPassword } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  if (!token) {
    return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: registration, error } = await db
    .from('registrations')
    .select('*, events(*)')
    .eq('qr_token', token)
    .single()

  if (error || !registration) {
    return NextResponse.json({ error: 'Ungültiger QR-Code.' }, { status: 404 })
  }

  if (registration.checked_in) {
    return NextResponse.json({
      status: 'already_checked_in',
      name: registration.name,
      checked_in_at: registration.checked_in_at,
    })
  }

  await db
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', registration.id)

  return NextResponse.json({
    status: 'success',
    name: registration.name,
    email: registration.email,
  })
}
