import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";
import { TicketPDF } from "@/app/components/TicketPDF";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

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
    .select("name, date, location, program")
    .eq("id", reg.event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden." }, { status: 404 });
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
    event: { name: event.name, date: event.date, location: event.location, program: event.program },
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
