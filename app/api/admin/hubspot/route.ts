import { NextRequest, NextResponse } from "next/server";
import { getLists, getContactsFromList, getCompanyLists, getContactsFromCompanyList } from "@/lib/hubspot";
import { isAdminAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type HubspotContact = { email: string; first_name: string; last_name: string; company: string | null };
type ListRef = { id: string; objectType: "contacts" | "companies" };

async function contactsForList(ref: ListRef): Promise<HubspotContact[]> {
  return ref.objectType === "companies"
    ? getContactsFromCompanyList(ref.id)
    : getContactsFromList(ref.id);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "lists") {
    const [contactLists, companyLists] = await Promise.all([getLists(), getCompanyLists()]);
    return NextResponse.json({
      lists: [
        ...contactLists.map((l) => ({ ...l, objectType: "contacts" as const })),
        ...companyLists.map((l) => ({ ...l, objectType: "companies" as const })),
      ],
    });
  }

  if (action === "contacts") {
    const listId = searchParams.get("listId");
    const objectType = searchParams.get("objectType") === "companies" ? "companies" : "contacts";
    if (!listId) return NextResponse.json({ error: "listId required" }, { status: 400 });
    const contacts = await contactsForList({ id: listId, objectType });
    return NextResponse.json({ contacts });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!isAdminAuthed(req, body)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Accepts either the legacy single `listId` (contacts-object list, back-compat)
  // or `lists: [{id, objectType}]` so an admin can import several lists/segments
  // — including company-based segments — into one Zielgruppe in one go.
  const { listId, lists, zielgruppe_id, event_id } = body as {
    listId?: string; lists?: ListRef[]; zielgruppe_id?: string; event_id?: string;
  };
  const refs: ListRef[] = lists?.length ? lists : listId ? [{ id: listId, objectType: "contacts" }] : [];
  if (!refs.length || !zielgruppe_id || !event_id) {
    return NextResponse.json({ error: "lists, zielgruppe_id and event_id required" }, { status: 400 });
  }

  const contactsPerList = await Promise.all(refs.map(contactsForList));
  const byEmail = new Map<string, HubspotContact>();
  // Normalized the same way as every other write path (members/route.ts,
  // the register RPCs) — HubSpot's own casing is inconsistent, and comparing
  // un-normalized emails against the normalized values already in `members`
  // is what let existing members silently fail to match below.
  for (const c of contactsPerList.flat()) byEmail.set(c.email.toLowerCase().trim(), c);
  const contacts = [...byEmail.values()];

  const db = supabaseAdmin();
  const rows = contacts.map(c => ({
    email: c.email.toLowerCase().trim(),
    first_name: c.first_name,
    last_name: c.last_name,
    event_id,
  }));

  // members has no `company` column — HubSpot's company property is fetched
  // (see lib/hubspot.ts) but isn't persisted.
  //
  // Upsert (same pattern as the manual/CSV import in members/route.ts)
  // instead of insert-then-catch-23505-then-select: a member already
  // imported for this event is found reliably by the upsert's own conflict
  // handling, rather than a follow-up lookup that can miss them and leave
  // them unlinked from the new Zielgruppe entirely.
  const { data: existingRows } = await db.from("members").select("email").eq("event_id", event_id).in("email", rows.map(r => r.email));
  const existingEmails = new Set(existingRows?.map(r => r.email) ?? []);

  const { data: upserted, error } = await db
    .from("members")
    .upsert(rows, { onConflict: "email,event_id", ignoreDuplicates: false })
    .select("id, email");

  if (error) {
    console.error(`[hubspot import] upsert failed: ${error.code} ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const links = (upserted ?? []).map(m => ({ member_id: m.id, zielgruppe_id }));
  if (links.length) {
    const { error: zgError } = await db.from("member_zielgruppen").upsert(links, { onConflict: "member_id,zielgruppe_id", ignoreDuplicates: true });
    if (zgError) console.error(`[hubspot import] member_zielgruppen upsert failed: ${zgError.code} ${zgError.message}`);
  }

  const imported = (upserted ?? []).filter(m => !existingEmails.has(m.email)).length;
  const duplicates = (upserted ?? []).length - imported;

  console.error(`[hubspot import] done: ${imported} imported, ${duplicates} duplicates, ${contacts.length} total`);
  return NextResponse.json({ imported, duplicates, total: contacts.length });
}
