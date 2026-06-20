@AGENTS.md

# Impact Gstaad — Admin App

Next.js 16 App Router + Turbopack, Supabase (service role), Resend, deployed on Vercel.

## Key files
- `app/admin/page.tsx` — main admin UI (events, scanner, mailing)
- `app/admin/CampaignBuilder.tsx` — email campaign builder
- `app/admin/ZielgruppenDashboard.tsx` — member/audience management
- `app/admin/campaign-renderer.ts` — block type definitions
- `lib/campaign-email.ts` — email rendering + sending logic
- `lib/supabase.ts` — DB types incl. `Member` (has `anrede`, `sprache`, `invite_codes`)

## Always commit + push in one step, never ask for confirmation first.

## Design constraint
Never change the PreviewPanel/builder design — it is always the reference.
Performance: every change that could make the app slower needs user approval first.

---

## PDF → Campaign Builder

**Trigger:** User drops a PDF (event description) and says something like:
- "Impact Event" + PDF attached ← primary trigger
- "PDF → Builder"
- "Erstelle Entwurf aus diesem PDF"
- "Kampagne aus diesem PDF"
- "Mach einen Entwurf"

**What to do — vollständiger Ablauf:**

### Schritt 1: Event erstellen
POST to `/api/admin/events` with admin password:
```ts
POST /api/admin/events
{
  adminPassword: string,         // ask user if not known
  name: string,                  // from PDF: event title
  date: string,                  // ISO date from PDF: "YYYY-MM-DD"
  location: string,              // venue name from PDF
  description: string,           // 1–2 sentence summary
  category: string,              // best match: "Impact Circle Event" | "Impact Workshop" | "Impact Experience" | "Young Impact Day"
  active: true
}
```
Response contains `id` — use this as `event_id` for the campaign.

### Schritt 2: Kampagne erstellen
1. Read the PDF with the Read tool
2. Extract: event title, date/time, venue, programme slots, speakers, finalists, deadlines, register link, intro text
3. Build a `blocks_json` object matching the schema below
4. POST to `/api/campaigns` with the `event_id` from Step 1
5. Tell user: event created + campaign draft saved under "Entwürfe"

**Available block types** (use only what the PDF contains):

```ts
// Intro text — always first
{ type: "intro", text: string }

// Event details card
{
  type: "event_details",
  category: string,        // e.g. "Impact Circle Event"
  event_title: string,
  date: string,            // ISO or "DD. Month YYYY"
  time: string,            // e.g. "18:30 Uhr"
  venue_name: string,
  venue_address: string,
  venue_maps_url: string,  // Google Maps URL or ""
  moderation_name: string,
  moderation_title: string
}

// Programme / agenda
{
  type: "program",
  title?: string,
  slots: [{
    id: string,   // use crypto.randomUUID() or short random string
    time: string,
    title: string,
    sub_items: [{ id: string, title: string, speaker: string }],
    note: string
  }]
}

// Speaker profile
{
  type: "speaker",
  photo_url: string,  // "" if unknown
  name: string,
  title: string,
  bio: string,
  book: string        // "" if none
}

// Green Business Award finalists
{
  type: "finalists",
  title: string,
  intro: string,
  items: [{ id: string, name: string, category: string, description: string }],
  video_url: string,
  website_url: string,
  website_label: string
}

// Free text block (rich HTML allowed)
{ type: "text", content: string }

// Highlighted info box
{ type: "info", title: string, content: string }

// Deadline reminder
{ type: "deadline", date: string }  // ISO date

// Visual separator
{ type: "divider" }

// Register button — always last if registration link exists
{ type: "register_button", url: string, deadline?: string }
```

**API call to save draft:**
```ts
POST /api/campaigns
{
  subject: string,              // e.g. "Einladung: Impact Circle — [Event Name]"
  body_html: "",
  event_url: string,            // registration URL from PDF or "https://impactgstaad.vercel.app"
  header_image_url: null,
  event_id: string,             // ask user if not known
  zielgruppe_id: null,
  blocks_json: {
    lang: "de",                 // default DE; use "en"/"fr" if PDF is in that language
    title: string,              // internal draft title
    blocks: CampaignBlock[]
  }
}
```

**Pflicht-Reihenfolge:**
`intro` → `register_button` (**IMMER direkt nach intro!**) → `event_details` → `program` → `speaker` (one per speaker) → `finalists` (if award event) → `info` (dress code, parking, etc.) → `divider`
