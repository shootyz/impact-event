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
  const { listId, lists, zielgruppe_id } = body as {
    listId?: string; lists?: ListRef[]; zielgruppe_id?: string;
  };
  const refs: ListRef[] = lists?.length ? lists : listId ? [{ id: listId, objectType: "contacts" }] : [];
  if (!refs.length || !zielgruppe_id) {
    return NextResponse.json({ error: "lists and zielgruppe_id required" }, { status: 400 });
  }

  const contactsPerList = await Promise.all(refs.map(contactsForList));
  const byEmail = new Map<string, HubspotContact>();
  for (const c of contactsPerList.flat()) byEmail.set(c.email.toLowerCase(), c);
  const contacts = [...byEmail.values()];

  const db = supabaseAdmin();
  let imported = 0;
  let duplicates = 0;

  for (const c of contacts) {
    const { error } = await db.from("members").insert({
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      company: c.company,
      zielgruppe_id,
    });
    if (error) {
      if (error.code === "23505") duplicates++;
    } else {
      imported++;
    }
  }

  return NextResponse.json({ imported, duplicates, total: contacts.length });
}
