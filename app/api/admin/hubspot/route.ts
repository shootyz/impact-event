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
  // members.email is globally unique across the whole app (constraint
  // members_email_key) — a person is ONE row regardless of which event they
  // originally came in under, not one row per event. So: look up who already
  // exists by email first, insert only the genuinely new ones (their
  // event_id gets set to the current event), then link everyone — new and
  // pre-existing — to this Zielgruppe. Pre-existing members keep whatever
  // event_id they already had; we never overwrite it here.
  const emails = rows.map(r => r.email);
  const { data: existingRows, error: existingError } = await db.from("members").select("id, email").in("email", emails);
  if (existingError) {
    console.error(`[hubspot import] lookup failed: ${existingError.code} ${existingError.message}`);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  const existingByEmail = new Map((existingRows ?? []).map(m => [m.email, m.id]));

  const newRows = rows.filter(r => !existingByEmail.has(r.email));
  if (newRows.length) {
    const { error: insertError } = await db.from("members").insert(newRows);
    if (insertError) {
      console.error(`[hubspot import] insert failed: ${insertError.code} ${insertError.message}`);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { data: allMembers, error: selectError } = await db.from("members").select("id").in("email", emails);
  if (selectError) {
    console.error(`[hubspot import] select failed: ${selectError.code} ${selectError.message}`);
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const links = (allMembers ?? []).map(m => ({ member_id: m.id, zielgruppe_id }));
  if (links.length) {
    const { error: zgError } = await db.from("member_zielgruppen").upsert(links, { onConflict: "member_id,zielgruppe_id", ignoreDuplicates: true });
    if (zgError) console.error(`[hubspot import] member_zielgruppen upsert failed: ${zgError.code} ${zgError.message}`);
  }

  const imported = newRows.length;
  const duplicates = existingByEmail.size;

  console.error(`[hubspot import] done: ${imported} imported, ${duplicates} duplicates, ${contacts.length} total`);
  return NextResponse.json({ imported, duplicates, total: contacts.length });
}
