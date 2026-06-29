import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { active, name, date, location, description, slug, category, registration_type, max_capacity, form_config, scanner_pin } = body

  const updates: Record<string, unknown> = {}
  if (active !== undefined) updates.active = active
  if (name !== undefined) updates.name = name.trim()
  if (date !== undefined) updates.date = date
  if (location !== undefined) updates.location = location.trim()
  if (description !== undefined) updates.description = description?.trim() || null
  if (slug !== undefined) updates.slug = slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || null
  if (category !== undefined) updates.category = category?.trim() || null
  if (registration_type !== undefined) updates.registration_type = registration_type
  if (max_capacity !== undefined) updates.max_capacity = max_capacity ? Number(max_capacity) : null
  if (form_config !== undefined) updates.form_config = form_config
  if (scanner_pin !== undefined) updates.scanner_pin = scanner_pin || null

  const { error } = await supabaseAdmin()
    .from('events')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Fehler beim Aktualisieren.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const auth = checkAdminAuth(req, body)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { error } = await supabaseAdmin()
    .from('events')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
