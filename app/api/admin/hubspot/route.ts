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
  for (const c of contactsPerList.flat()) byEmail.set(c.email.toLowerCase(), c);
  const contacts = [...byEmail.values()];

  const db = supabaseAdmin();
  let imported = 0;
  let duplicates = 0;

  for (const c of contacts) {
    // members has no `company` column — HubSpot's company property is fetched
    // (see lib/hubspot.ts) but isn't persisted; every insert here silently
    // failed with PGRST204 until this was caught via the added error logging.
    const { data: insertedMember, error } = await db.from("members").insert({
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      event_id,
    }).select("id").single();

    let memberId: string | null = insertedMember?.id ?? null;
    if (error) {
      if (error.code !== "23505") {
        console.error(`[hubspot import] insert failed for ${c.email}: ${error.code} ${error.message}`);
        continue;
      }
      duplicates++;
      // Contact already exists for this event (e.g. from an earlier import) —
      // still add them to this Zielgruppe, since a member can now belong to
      // several at once.
      const { data: existing } = await db.from("members").select("id").eq("email", c.email).eq("event_id", event_id).limit(1);
      memberId = existing?.[0]?.id ?? null;
    } else {
      imported++;
    }

    if (memberId) {
      const { error: zgError } = await db.from("member_zielgruppen").upsert({ member_id: memberId, zielgruppe_id }, { onConflict: "member_id,zielgruppe_id", ignoreDuplicates: true });
      if (zgError) console.error(`[hubspot import] member_zielgruppen upsert failed for ${c.email}: ${zgError.code} ${zgError.message}`);
    }
  }

  console.error(`[hubspot import] done: ${imported} imported, ${duplicates} duplicates, ${contacts.length} total`);
  return NextResponse.json({ imported, duplicates, total: contacts.length });
}
