import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { adminPassword, active, name, date, location, description, slug } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const updates: Record<string, unknown> = {}
  if (active !== undefined) updates.active = active
  if (name !== undefined) updates.name = name.trim()
  if (date !== undefined) updates.date = date
  if (location !== undefined) updates.location = location.trim()
  if (description !== undefined) updates.description = description?.trim() || null
  if (slug !== undefined) updates.slug = slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || null

  const { error } = await supabaseAdmin()
    .from('events')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Fehler beim Aktualisieren.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
