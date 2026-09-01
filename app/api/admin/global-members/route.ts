import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select("id, first_name, last_name, email, anrede, sprache, unsubscribed, email_status, created_at, member_zielgruppen(zielgruppen(name, events(name)))")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // PostgREST's inferred shape for these nested embeds isn't reliable to type exactly
  // (single-vs-array varies by how it detects the relationship), so this flattens
  // defensively rather than assuming one shape.
  const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v ? [v] : []);
  const members = (data ?? []).map((m) => {
    const { member_zielgruppen, ...rest } = m as Record<string, unknown>;
    const zielgruppen = asArray(member_zielgruppen)
      .flatMap((l) => asArray((l as { zielgruppen?: unknown })?.zielgruppen))
      .filter((z): z is { name: string; events?: { name: string } | { name: string }[] | null } => !!z && typeof z === "object" && "name" in z)
      .map((z) => ({ name: z.name, events: asArray(z.events)[0] ?? null }));
    return { ...rest, zielgruppen };
  });
  return NextResponse.json({ members });
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
