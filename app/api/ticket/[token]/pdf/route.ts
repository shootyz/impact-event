import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveLangField } from "@/lib/i18n";
import { isTicketTokenExpired } from "@/lib/ticketToken";
import { resolveTicketProgram } from "@/lib/ticketProgram";
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

  // events.ticket_program is the directly-editable ticket schedule (see the
  // "Text auf PDF-Ticket" settings card); falls back to the Zeitplan block of
  // whichever campaign in this language is flagged/most recent, for events
  // that haven't used the new editor yet.
  const ticketProgram = await resolveTicketProgram(db, reg.event_id, lang);
  const programTitle = ticketProgram?.title;
  const programSlots = ticketProgram?.slots;

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
