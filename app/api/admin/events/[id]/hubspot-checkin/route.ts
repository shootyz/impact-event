import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureEventOption, addContactsToEventProperty } from "@/lib/hubspot";

// Pushes checked-in guests for this event into HubSpot as contacts and tags
// them with this event's "Impact Gstaad Events" checkbox option (see
// lib/hubspot.ts) so they appear in the corresponding HubSpot segment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, props: any) {
  const { id } = await props.params;
  const body = await req.json().catch(() => ({}));
  const _a = checkAdminAuth(req, body ?? {});
  if (_a !== "ok") return NextResponse.json({ error: _a === "rate_limited" ? "Zu viele Anfragen." : "Unauthorized" }, { status: _a === "rate_limited" ? 429 : 401 });

  const db = supabaseAdmin();
  const { data: event, error: eventError } = await db.from("events").select("name, date").eq("id", id).single();
  if (eventError || !event) return NextResponse.json({ error: "Event nicht gefunden." }, { status: 404 });

  const { data: registrations, error: regError } = await db
    .from("registrations")
    .select("name, email")
    .eq("event_id", id)
    .eq("checked_in", true);
  if (regError) return NextResponse.json({ error: regError.message }, { status: 500 });

  if (!registrations || registrations.length === 0) {
    return NextResponse.json({ pushed: 0, total: 0, label: null });
  }

  const optionValue = await ensureEventOption(event.name, event.date);
  const contacts = registrations.map((r) => {
    const parts = r.name.trim().split(" ");
    return { email: r.email, first_name: parts.slice(0, -1).join(" ") || r.name, last_name: parts.slice(-1)[0] ?? "" };
  });
  const { pushed } = await addContactsToEventProperty(contacts, optionValue);

  return NextResponse.json({ pushed, total: contacts.length, optionValue });
}
