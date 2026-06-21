import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB

export async function POST(req: NextRequest) {
  const _a = checkAdminAuth(req); if (_a !== 'ok') { return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 }) }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP, GIF.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu gross (max. 8 MB).' }, { status: 400 })
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
