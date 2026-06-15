import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const db = supabaseAdmin()
  const { error } = await db.storage
    .from('campaign-images')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage
    .from('campaign-images')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
