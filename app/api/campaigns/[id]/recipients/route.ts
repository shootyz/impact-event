import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, props: any) {
  const auth = checkAdminAuth(req)
  if (auth !== 'ok') return NextResponse.json({ error: auth === 'rate_limited' ? 'Zu viele Anfragen.' : 'Unauthorized' }, { status: auth === 'rate_limited' ? 429 : 401 })

  const { id } = await props.params
  const db = supabaseAdmin()
  const [{ data, error }, { data: events }] = await Promise.all([
    db.from('campaign_recipients').select('email, first_name, last_name').eq('campaign_id', id).order('last_name', { ascending: true }),
    db.from('campaign_events').select('type, email').eq('campaign_id', id),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const typesByEmail = new Map<string, Set<string>>()
  for (const e of events ?? []) {
    if (!e.email) continue
    if (!typesByEmail.has(e.email)) typesByEmail.set(e.email, new Set())
    typesByEmail.get(e.email)!.add(e.type)
  }

  const enriched = (data ?? []).map(r => {
    const types = typesByEmail.get(r.email) ?? new Set<string>()
    return {
      ...r,
      delivered: types.has('delivered'),
      opened: types.has('open'),
      clicked: types.has('click'),
      bounced: types.has('bounced'),
      complained: types.has('complained'),
      failed: types.has('failed'),
    }
  })
  return NextResponse.json(enriched)
}
