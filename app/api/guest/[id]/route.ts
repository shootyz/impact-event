import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { adminPassword } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  await supabaseAdmin().from('registrations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { adminPassword, checked_in } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  await supabaseAdmin()
    .from('registrations')
    .update({
      checked_in,
      checked_in_at: checked_in ? new Date().toISOString() : null,
    })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
