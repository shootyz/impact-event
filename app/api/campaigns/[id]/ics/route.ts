import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { CampaignBlock, EventDetailsBlock } from '@/app/admin/campaign-renderer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: NextRequest, props: any) {
  const { id } = await props.params
  const db = supabaseAdmin()
  const { data: campaign, error } = await db
    .from('campaigns')
    .select('subject, blocks_json')
    .eq('id', id)
    .single()

  if (error || !campaign) return new NextResponse('Not found', { status: 404 })

  let blocks: CampaignBlock[] = []
  try {
    const parsed = typeof campaign.blocks_json === 'string'
      ? JSON.parse(campaign.blocks_json || '[]')
      : (campaign.blocks_json ?? [])
    blocks = Array.isArray(parsed) ? parsed : (parsed.blocks ?? [])
  } catch { /* empty */ }

  const detailsBlock = blocks.find(b => b.type === 'event_details') as (EventDetailsBlock & { time?: string }) | undefined

  if (!detailsBlock?.date) return new NextResponse('No event date found', { status: 404 })

  const pad = (n: number) => String(n).padStart(2, '0')
  const isoDate = detailsBlock.date.match(/^\d{4}-\d{2}-\d{2}$/)
    ? detailsBlock.date
    : (() => { const d = new Date(detailsBlock.date); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10) })()

  if (!isoDate) return new NextResponse('Invalid date', { status: 400 })

  const timeStr = detailsBlock.time || '13:00'
  const start = new Date(`${isoDate}T${timeStr}:00`)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`

  const location = detailsBlock.venue_name ?? ''
  const icsTitle = [(detailsBlock as EventDetailsBlock & { category?: string; event_title?: string }).category, (detailsBlock as EventDetailsBlock & { category?: string; event_title?: string }).event_title].filter(Boolean).join(': ') || campaign.subject

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Impact Gstaad//EN',
    'BEGIN:VEVENT',
    `UID:${id}@impactgstaad.ch`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${icsTitle}`,
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${campaign.subject.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics"`,
    },
  })
}
