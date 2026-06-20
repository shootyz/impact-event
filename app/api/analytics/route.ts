import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = supabaseAdmin()

  const [
    { data: members },
    { data: zielgruppen },
    { data: campaigns },
    { data: inviteCodes },
    { data: registrations },
  ] = await Promise.all([
    db.from('members').select('id, sprache, anrede, zielgruppe_id, unsubscribed').eq('event_id', eventId),
    db.from('zielgruppen').select('id, name').eq('event_id', eventId),
    db.from('campaigns').select('id, subject, blocks_json, sent_at, recipient_count, zielgruppe_id').eq('event_id', eventId).not('sent_at', 'is', null).order('sent_at', { ascending: false }),
    db.from('invite_codes').select('member_id, used').in('member_id', (await db.from('members').select('id').eq('event_id', eventId)).data?.map((m: { id: string }) => m.id) ?? []),
    db.from('registrations').select('checked_in, checked_in_at, created_at').eq('event_id', eventId),
  ])

  const activeMembers = (members ?? []).filter((m: { unsubscribed: boolean }) => !m.unsubscribed)

  // Members by Zielgruppe
  const zgMap = Object.fromEntries((zielgruppen ?? []).map((z: { id: string; name: string }) => [z.id, z.name]))
  const byZielgruppe: Record<string, number> = {}
  for (const m of activeMembers as { zielgruppe_id: string | null }[]) {
    const key = m.zielgruppe_id ? (zgMap[m.zielgruppe_id] ?? 'Unbekannt') : 'Ohne Zielgruppe'
    byZielgruppe[key] = (byZielgruppe[key] ?? 0) + 1
  }

  // Members by Sprache
  const bySprache: Record<string, number> = {}
  for (const m of activeMembers as { sprache: string | null }[]) {
    const key = m.sprache ? m.sprache.toUpperCase() : '—'
    bySprache[key] = (bySprache[key] ?? 0) + 1
  }

  // Members by Anrede
  const byAnrede: Record<string, number> = {}
  for (const m of activeMembers as { anrede: string | null }[]) {
    const key = m.anrede || '—'
    byAnrede[key] = (byAnrede[key] ?? 0) + 1
  }

  // Invite codes
  const totalCodes = (inviteCodes ?? []).length
  const usedCodes = (inviteCodes ?? []).filter((c: { used: boolean }) => c.used).length

  // Campaigns
  const campaignList = (campaigns ?? []).map((c: { id: string; subject: string; blocks_json: unknown; sent_at: string; recipient_count: number | null; zielgruppe_id: string | null }) => {
    const bj = c.blocks_json as { lang?: string; title?: string } | null
    return {
      id: c.id,
      title: (bj && !Array.isArray(bj) ? bj.title : null) || c.subject,
      lang: bj && !Array.isArray(bj) ? (bj.lang ?? null) : null,
      sent_at: c.sent_at,
      recipient_count: c.recipient_count ?? 0,
      zielgruppe: c.zielgruppe_id ? (zgMap[c.zielgruppe_id] ?? null) : null,
    }
  })

  // Registrations check-in by hour
  const checkinByHour: Record<number, number> = {}
  for (const r of (registrations ?? []) as { checked_in: boolean; checked_in_at: string | null }[]) {
    if (r.checked_in && r.checked_in_at) {
      const hour = new Date(r.checked_in_at).getHours()
      checkinByHour[hour] = (checkinByHour[hour] ?? 0) + 1
    }
  }

  return NextResponse.json({
    members: {
      total: activeMembers.length,
      unsubscribed: (members ?? []).length - activeMembers.length,
      byZielgruppe: Object.entries(byZielgruppe).sort((a, b) => b[1] - a[1]),
      bySprache: Object.entries(bySprache).sort((a, b) => b[1] - a[1]),
      byAnrede: Object.entries(byAnrede).sort((a, b) => b[1] - a[1]),
    },
    inviteCodes: { total: totalCodes, used: usedCodes },
    campaigns: {
      total: campaignList.length,
      totalRecipients: campaignList.reduce((s: number, c: { recipient_count: number }) => s + c.recipient_count, 0),
      list: campaignList,
    },
    registrations: {
      total: (registrations ?? []).length,
      checkedIn: (registrations ?? []).filter((r: { checked_in: boolean }) => r.checked_in).length,
      byHour: Object.entries(checkinByHour).map(([h, c]) => ({ hour: Number(h), count: c })).sort((a, b) => a.hour - b.hour),
    },
  })
}
