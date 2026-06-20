import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// One-time demo seed — protected by admin password
export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()

  // ── 1. Event ──
  const { data: event, error: evErr } = await db
    .from('events')
    .insert({
      name: 'Impact Gstaad 2025 — Demo',
      date: '2025-09-06',
      location: 'Gstaad Palace',
      description: 'Demo-Event mit vollständigen Statistiken.',
    })
    .select()
    .single()
  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 })
  const eventId = event.id

  // ── 2. Zielgruppen ──
  const { data: zgs } = await db
    .from('zielgruppen')
    .insert([
      { event_id: eventId, name: 'VIP Gäste' },
      { event_id: eventId, name: 'Partner & Sponsoren' },
      { event_id: eventId, name: 'Media' },
    ])
    .select()
  const [zgVip, zgPartner, zgMedia] = zgs ?? []

  // ── 3. Members ──
  const memberRows = [
    // VIP DE
    { event_id: eventId, first_name: 'Katharina', last_name: 'von Arx', email: 'k.vonarx@demo.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Thomas', last_name: 'Müller', email: 't.mueller@demo.ch', anrede: 'Herr', sprache: 'de', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Sophie', last_name: 'Reuter', email: 's.reuter@demo.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Markus', last_name: 'Steinberg', email: 'm.steinberg@demo.ch', anrede: 'Herr', sprache: 'de', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Elena', last_name: 'Braun', email: 'e.braun@demo.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Claire', last_name: 'Dupont', email: 'c.dupont@demo.fr', anrede: 'Frau', sprache: 'fr', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Pierre', last_name: 'Martin', email: 'p.martin@demo.fr', anrede: 'Herr', sprache: 'fr', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'James', last_name: 'Whitfield', email: 'j.whitfield@demo.com', anrede: 'Herr', sprache: 'en', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Sarah', last_name: 'Collins', email: 's.collins@demo.com', anrede: 'Frau', sprache: 'en', zielgruppe_id: zgVip.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Andreas', last_name: 'Keller', email: 'a.keller@partner.ch', anrede: 'Herr', sprache: 'de', zielgruppe_id: zgPartner.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Monika', last_name: 'Huber', email: 'm.huber@partner.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgPartner.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Christian', last_name: 'Bauer', email: 'c.bauer@partner.ch', anrede: 'Herr', sprache: 'de', zielgruppe_id: zgPartner.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Laura', last_name: 'Fischer', email: 'l.fischer@partner.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgPartner.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Michael', last_name: 'Hart', email: 'm.hart@partner.com', anrede: 'Herr', sprache: 'en', zielgruppe_id: zgPartner.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Julia', last_name: 'Weber', email: 'j.weber@media.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgMedia.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'David', last_name: 'Schmid', email: 'd.schmid@media.ch', anrede: 'Herr', sprache: 'de', zielgruppe_id: zgMedia.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Lena', last_name: 'Koch', email: 'l.koch@media.ch', anrede: 'Frau', sprache: 'de', zielgruppe_id: zgMedia.id, unsubscribe_token: randomUUID(), unsubscribed: false },
    { event_id: eventId, first_name: 'Hans', last_name: 'Zimmer', email: 'h.zimmer@demo.ch', anrede: 'Herr', sprache: 'de', zielgruppe_id: zgVip.id, unsubscribed: true, unsubscribe_token: randomUUID() },
  ]

  const { data: members, error: memErr } = await db.from('members').insert(memberRows).select()
  if (memErr || !members) return NextResponse.json({ error: 'members insert failed', detail: memErr?.message, hint: memErr?.hint, code: memErr?.code }, { status: 500 })

  // ── 4. Invite codes ──
  const subscribedMembers = members.filter((m: { unsubscribed: boolean }) => !m.unsubscribed)
  const codeRows = subscribedMembers.map((m: { id: string }, i: number) => ({
    member_id: m.id,
    event_id: eventId,
    code: `DEMO-${String(i + 1).padStart(3, '0')}`,
    used: i < 14, // 14 of 17 used
  }))
  await db.from('invite_codes').insert(codeRows)

  // ── 5. Registrations (14 registered, 11 checked in) ──
  const baseDate = new Date('2025-09-06T10:00:00Z')
  const checkInOffsets = [0, 12, 25, 40, 55, 70, 90, 110, 130, 155, 180] // minutes
  const registeredMembers = subscribedMembers.slice(0, 14)
  const regRows = registeredMembers.map((m: { id: string }, i: number) => {
    const checkedIn = i < 11
    const checkinTime = checkedIn
      ? new Date(baseDate.getTime() + checkInOffsets[i] * 60 * 1000).toISOString()
      : null
    return {
      event_id: eventId,
      member_id: m.id,
      checked_in: checkedIn,
      checked_in_at: checkinTime,
      created_at: new Date(baseDate.getTime() - (14 - i) * 3600 * 1000).toISOString(),
    }
  })
  await db.from('registrations').insert(regRows)

  // ── 6. Campaigns (3: sent DE, sent EN, draft) ──
  const sentAt1 = '2025-08-01T09:00:00Z'
  const sentAt2 = '2025-08-15T10:30:00Z'

  const deMembers = subscribedMembers.filter((m: { sprache: string }) => (m.sprache || 'de') === 'de')
  const enMembers = subscribedMembers.filter((m: { sprache: string }) => m.sprache === 'en')

  const { data: campaigns } = await db.from('campaigns').insert([
    {
      event_id: eventId,
      subject: 'Ihre Einladung zum Impact Gstaad 2025',
      blocks_json: { lang: 'de', title: 'Einladung Impact Gstaad 2025', blocks: [] },
      sent_at: sentAt1,
      recipient_count: deMembers.length,
      zielgruppe_id: null,
      event_url: `https://impactgstaad.vercel.app?event=${eventId}`,
    },
    {
      event_id: eventId,
      subject: 'Your Invitation to Impact Gstaad 2025',
      blocks_json: { lang: 'en', title: 'Invitation Impact Gstaad 2025', blocks: [] },
      sent_at: sentAt2,
      recipient_count: enMembers.length,
      zielgruppe_id: null,
      event_url: `https://impactgstaad.vercel.app?event=${eventId}`,
    },
    {
      event_id: eventId,
      subject: 'Erinnerung: Impact Gstaad findet bald statt',
      blocks_json: { lang: 'de', title: 'Erinnerung Impact Gstaad 2025', blocks: [] },
      sent_at: null, // draft
      recipient_count: null,
      zielgruppe_id: zgVip.id,
      event_url: `https://impactgstaad.vercel.app?event=${eventId}`,
    },
  ]).select()

  if (!campaigns) return NextResponse.json({ error: 'campaigns insert failed' }, { status: 500 })
  const [campDe, campEn] = campaigns

  // ── 7. Campaign events (opens + clicks) ──
  // DE campaign: ~70% open rate, ~30% click rate
  const deOpeners = deMembers.slice(0, Math.round(deMembers.length * 0.72))
  const deClickers = deMembers.slice(0, Math.round(deMembers.length * 0.31))
  // EN campaign: ~60% open rate, ~40% click rate
  const enOpeners = enMembers.slice(0, Math.round(enMembers.length * 0.67))
  const enClickers = enMembers.slice(0, Math.round(enMembers.length * 0.33))

  const evRows = [
    ...deOpeners.map((m: { id: string }) => ({ campaign_id: campDe.id, member_id: m.id, type: 'open', created_at: new Date(new Date(sentAt1).getTime() + Math.random() * 48 * 3600000).toISOString() })),
    ...deClickers.map((m: { id: string }) => ({ campaign_id: campDe.id, member_id: m.id, type: 'click', created_at: new Date(new Date(sentAt1).getTime() + Math.random() * 36 * 3600000).toISOString() })),
    ...enOpeners.map((m: { id: string }) => ({ campaign_id: campEn.id, member_id: m.id, type: 'open', created_at: new Date(new Date(sentAt2).getTime() + Math.random() * 48 * 3600000).toISOString() })),
    ...enClickers.map((m: { id: string }) => ({ campaign_id: campEn.id, member_id: m.id, type: 'click', created_at: new Date(new Date(sentAt2).getTime() + Math.random() * 36 * 3600000).toISOString() })),
  ]
  await db.from('campaign_events').insert(evRows)

  return NextResponse.json({
    ok: true,
    eventId,
    eventName: event.name,
    members: members.length,
    campaigns: campaigns.length,
    message: 'Demo-Event erfolgreich erstellt!',
  })
}
