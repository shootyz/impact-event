import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB

// Magic byte signatures — validates actual file content, not just browser-reported Content-Type
function detectMimeFromBytes(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.slice(0, 8).toString('binary') === '\x89PNG\r\n\x1a\n') return 'image/png'
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (buf.slice(0, 6).toString('ascii') === 'GIF87a' || buf.slice(0, 6).toString('ascii') === 'GIF89a') return 'image/gif'
  return null
}

export async function POST(req: NextRequest) {
  const _a = checkAdminAuth(req)
  if (_a !== 'ok') return NextResponse.json({ error: _a === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: _a === 'rate_limited' ? 429 : 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu gross (max. 8 MB).' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate actual magic bytes — ignores browser-reported Content-Type
  const detectedType = detectMimeFromBytes(buffer)
  if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
    return NextResponse.json({ error: 'Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP, GIF.' }, { status: 400 })
  }

  const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extMap[detectedType]}`

  const db = supabaseAdmin()
  const { error } = await db.storage
    .from('campaign-images')
    .upload(filename, buffer, { contentType: detectedType, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage
    .from('campaign-images')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
