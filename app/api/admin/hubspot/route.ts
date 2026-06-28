import { NextRequest, NextResponse } from "next/server";
import { getLists, getContactsFromList } from "@/lib/hubspot";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthed } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "lists") {
    const lists = await getLists();
    return NextResponse.json({ lists });
  }

  if (action === "contacts") {
    const listId = searchParams.get("listId");
    if (!listId) return NextResponse.json({ error: "listId required" }, { status: 400 });
    const contacts = await getContactsFromList(listId);
    return NextResponse.json({ contacts });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!isAdminAuthed(req, body)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { listId, zielgruppe_id } = body;
  if (!listId || !zielgruppe_id) {
    return NextResponse.json({ error: "listId and zielgruppe_id required" }, { status: 400 });
  }

  const contacts = await getContactsFromList(listId);
  let imported = 0;
  let duplicates = 0;

  for (const c of contacts) {
    const { error } = await supabase.from("members").insert({
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
