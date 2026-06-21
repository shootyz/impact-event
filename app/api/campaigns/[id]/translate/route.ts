import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French (Switzerland)',
  de: 'German (Switzerland)',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, props: any) {
  const { id } = await props.params
  const { adminPassword, targetLang } = await req.json()

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  if (!['en', 'fr', 'de'].includes(targetLang)) {
    return NextResponse.json({ error: 'Ungültige Zielsprache. Erlaubt: en, fr, de' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data: campaign, error } = await db
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Kampagne nicht gefunden.' }, { status: 404 })
  }

  const blocksJson = typeof campaign.blocks_json === 'string'
    ? JSON.parse(campaign.blocks_json)
    : campaign.blocks_json

  const langName = LANG_NAMES[targetLang]
  const sourceLang = (blocksJson?.lang as string) ?? 'de'
  const sourceLangName = LANG_NAMES[sourceLang] ?? sourceLang

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are translating an email campaign from ${sourceLangName} to ${langName}.

Translate ONLY the user-visible text content in the blocks_json below. Rules:
- Translate all "text", "title", "subject", "bio", "intro", "name" (only if it's a title/label, NOT a person's name), "description", "note", "content", "label" fields that contain prose.
- Do NOT translate: proper nouns (person names, company names, place names, event names like "Impact Circle", "Impact Gstaad"), URLs, email addresses, dates, times, codes, IDs.
- Keep the exact same JSON structure — only change string values that are user-visible text.
- For the "subject" field at the top level, translate it too.
- The "lang" field inside blocks_json should be changed to "${targetLang}".
- Return ONLY valid JSON, no explanation, no markdown code fences.

Subject to translate: ${JSON.stringify(campaign.subject)}

blocks_json to translate:
${JSON.stringify(blocksJson, null, 2)}`

  let translated: { lang?: string; title?: string; blocks?: unknown[] }
  let translatedSubject: string

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: '{"lang":"',
        },
      ],
    })

    const raw = '{"lang":"' + (message.content[0] as { type: string; text: string }).text
    const parsed = JSON.parse(raw)
    translated = parsed.blocks_json ?? parsed
    translatedSubject = parsed.subject ?? campaign.subject
  } catch (e) {
    console.error('Translation failed:', e)
    return NextResponse.json({ error: 'Übersetzung fehlgeschlagen.' }, { status: 500 })
  }

  // Create new draft campaign
  const { data: newCampaign, error: insertError } = await db
    .from('campaigns')
    .insert({
      subject: translatedSubject,
      body_html: campaign.body_html ?? '',
      event_url: campaign.event_url,
      header_image_url: campaign.header_image_url,
      event_id: campaign.event_id,
      zielgruppe_id: campaign.zielgruppe_id,
      blocks_json: translated,
    })
    .select()
    .single()

  if (insertError || !newCampaign) {
    return NextResponse.json({ error: 'Entwurf konnte nicht erstellt werden.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    id: newCampaign.id,
    lang: targetLang,
    subject: translatedSubject,
  })
}
