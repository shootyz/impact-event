import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') {
    return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })
  }

  const { token } = body
  if (!token) return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db.rpc('scan_checkin_atomic', { p_token: token })
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Check-in fehlgeschlagen.' }, { status: 500 })
  }

  const result = data as { status: string; name?: string; email?: string; checked_in_at?: string }
  if (result.status === 'not_found') return NextResponse.json({ error: 'Ungültiger QR-Code.' }, { status: 404 })
  if (result.status === 'already_checked_in') return NextResponse.json({ status: 'already_checked_in', name: result.name, checked_in_at: result.checked_in_at })
  return NextResponse.json({ status: 'success', name: result.name, email: result.email })
}
