import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select("id, first_name, last_name, email, anrede, sprache, unsubscribed, created_at, zielgruppe_id, zielgruppen(name, events(name))")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = supabaseAdmin();

  // Delete all (filtered by optional event name)
  if (body.deleteAll) {
    const { error } = await db.from("members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Delete single or multiple by IDs
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [body.id];
  if (!ids.length) return NextResponse.json({ error: "ids fehlt." }, { status: 400 });
  const { error } = await db.from("members").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
