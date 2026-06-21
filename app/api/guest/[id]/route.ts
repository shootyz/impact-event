import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  await supabaseAdmin().from('registrations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { checked_in } = body
  await supabaseAdmin().from('registrations').update({ checked_in, ...(checked_in ? { checked_in_at: new Date().toISOString() } : { checked_in_at: null }) }).eq('id', id)
  return NextResponse.json({ ok: true })
}
