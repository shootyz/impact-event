import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLang, resolveLangField } from '@/lib/i18n'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const slug = req.nextUrl.searchParams.get('slug')
  const lang = getLang(req.nextUrl.searchParams)
  // Service_role client: this route reads registration_password (to expose only a
  // boolean to the client). The anon role has no column access to that field.
  const base = supabaseAdmin()
    .from('events')
    .select('id, name, name_en, name_fr, date, location, location_en, location_fr, description, description_en, description_fr, registration_password, registration_type, max_capacity, form_config')
  const { data: event, error } = await (
    id ? base.eq('id', id).eq('active', true) :
    slug ? base.eq('slug', slug).eq('active', true) :
    base.eq('active', true)
  ).single()

  if (error || !event) {
    return NextResponse.json({ error: 'Kein aktiver Event.' }, { status: 404 })
  }

  return NextResponse.json(
    {
      id: event.id,
      name: resolveLangField(lang, event.name, event.name_en, event.name_fr),
      date: event.date,
      location: resolveLangField(lang, event.location, event.location_en, event.location_fr),
      description: resolveLangField(lang, event.description, event.description_en, event.description_fr),
      registration_password: !!event.registration_password,
      registration_type: event.registration_type ?? 'invite',
      max_capacity: event.max_capacity ?? null,
      form_config: event.form_config ?? null,
    },
    {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    }
  )
}
