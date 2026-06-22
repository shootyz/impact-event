import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(/[,;]/).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())

  const nameIdx = headers.findIndex((h) => h === 'name' || h === 'nachname')
  const vornameIdx = headers.findIndex((h) => h === 'vorname')
  const emailIdx = headers.findIndex((h) => h === 'e-mail' || h === 'email' || h === 'e_mail')

  if (emailIdx === -1) return []

  return lines.slice(1).map((line) => {
    const cols = line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ''))
    const vorname = vornameIdx !== -1 ? cols[vornameIdx] || '' : ''
    const nachname = nameIdx !== -1 ? cols[nameIdx] || '' : ''
    const fullName = [vorname, nachname].filter(Boolean).join(' ')
    return {
      name: fullName || cols[0] || '',
      email: cols[emailIdx] || '',
    }
  }).filter((r) => r.email.includes('@'))
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const adminPassword = formData.get('adminPassword') as string
  const file = formData.get('file') as File | null
  const eventId = formData.get('eventId') as string | null

  const auth = checkAdminAuth(req, { adminPassword })
  if (auth !== 'ok') {
    return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Nicht autorisiert.' }, { status: auth === 'rate_limited' ? 429 : 401 })
  }

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei.' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Zeilen gefunden. Spalten: Name, Vorname, E-Mail' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const base = db.from('events').select('id')
  const { data: event } = await (eventId ? base.eq('id', eventId) : base.eq('active', true).order('date', { ascending: true }).limit(1)).single()
  if (!event) return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })

  const { data: existing } = await db
    .from('registrations')
    .select('email')
    .eq('event_id', event.id)

  const existingEmails = new Set((existing || []).map((r: { email: string }) => r.email.toLowerCase()))

  const imported: string[] = []
  const duplicates: string[] = []
  const errors: string[] = []
  const batchEmails = new Set<string>()

  for (const row of rows) {
    const email = row.email.toLowerCase().trim()
    const name = row.name.trim()

    if (!name || !email) {
      errors.push(`Ungültige Zeile: "${row.name}" <${row.email}>`)
      continue
    }

    if (existingEmails.has(email) || batchEmails.has(email)) {
      duplicates.push(`${name} <${email}>`)
      continue
    }

    batchEmails.add(email)

    const { error } = await db.from('registrations').insert({
      name,
      email,
      event_id: event.id,
      qr_token: randomUUID(),
      checked_in: false,
    })

    if (error) {
      errors.push(`Fehler bei ${name}: ${error.message}`)
    } else {
      imported.push(email)
    }
  }

  return NextResponse.json({ imported: imported.length, duplicates, errors })
}
