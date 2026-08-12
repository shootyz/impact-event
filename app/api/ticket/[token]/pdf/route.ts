import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveLangField } from "@/lib/i18n";
import { isTicketTokenExpired } from "@/lib/ticketToken";
import { TicketPDF } from "@/app/components/TicketPDF";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = langParam === "de" || langParam === "fr" ? langParam : "en";

  const db = supabaseAdmin();
  const { data: reg } = await db
    .from("registrations")
    .select("name, event_id")
    .eq("qr_token", token)
    .single();

  if (!reg) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const { data: event } = await db
    .from("events")
    .select("name, name_en, name_fr, date, location, location_en, location_fr, category, program")
    .eq("id", reg.event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden." }, { status: 404 });
  }
  if (isTicketTokenExpired(event.date)) {
    return NextResponse.json({ error: "Dieser Ticket-Link ist abgelaufen." }, { status: 410 });
  }

  // Reuse the "Zeitplan" (program) block already authored in this event's campaign
  // builder for this language, instead of maintaining a separate copy just for the
  // PDF. A sent campaign can never be edited again, so relying on "most recently
  // sent" would leave no way to fix a schedule mistake afterwards — instead, prefer
  // whichever campaign an admin has explicitly marked via is_pdf_source (see
  // mark-ticket-source route). Falls back to the most recently sent/drafted
  // campaign in this language for events that haven't marked one yet.
  const { data: eventCampaigns } = await db
    .from("campaigns")
    .select("blocks_json, sent_at, created_at, is_pdf_source")
    .eq("event_id", reg.event_id);

  type ProgramSlot = { id: string; time: string; title: string; sub_items: { id: string; title: string; speaker: string }[]; note: string; is_break?: boolean };
  let programTitle: string | undefined;
  let programSlots: ProgramSlot[] | undefined;

  const candidates = (eventCampaigns ?? [])
    .map(c => {
      let parsed: { lang?: string; blocks?: { type: string; title?: string; slots?: ProgramSlot[] }[] } | null = null;
      try { parsed = typeof c.blocks_json === "string" ? JSON.parse(c.blocks_json) : c.blocks_json; } catch { /* ignore malformed */ }
      return { ...c, parsed };
    })
    .filter(c => c.parsed && !Array.isArray(c.parsed) && c.parsed.lang === lang)
    .sort((a, b) => {
      if (a.is_pdf_source && !b.is_pdf_source) return -1;
      if (!a.is_pdf_source && b.is_pdf_source) return 1;
      if (a.sent_at && !b.sent_at) return -1;
      if (!a.sent_at && b.sent_at) return 1;
      const aTime = new Date(a.sent_at ?? a.created_at).getTime();
      const bTime = new Date(b.sent_at ?? b.created_at).getTime();
      return bTime - aTime;
    });

  const programBlock = candidates[0]?.parsed?.blocks?.find(b => b.type === "program");
  if (programBlock) {
    programTitle = programBlock.title;
    programSlots = programBlock.slots ?? [];
  }

  const ticketUrl = `${req.nextUrl.origin}/ticket/${token}`;
  const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
    width: 400,
    margin: 1,
    color: { dark: "#1E3263", light: "#FFFFFF" },
  });

  // Read logo as base64 data URL
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const element = createElement(TicketPDF, {
    guestName: reg.name,
    token,
    qrDataUrl,
    logoUrl: logoDataUrl,
    lang,
    event: {
      name: resolveLangField(lang, event.name, event.name_en, event.name_fr),
      date: event.date,
      location: resolveLangField(lang, event.location, event.location_en, event.location_fr),
      category: event.category,
      programTitle,
      programSlots,
      program: !programSlots ? event.program : null,
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await renderToBuffer(element as any);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${token.substring(0, 8)}.pdf"`,
    },
  });
}
