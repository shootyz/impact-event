import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import RegistrationForm, { type EventPayload } from "./RegistrationForm";

// Fetch the event server-side so its name/date/location are in the initial HTML
// (faster first paint, especially on mobile). Mirrors the shape of /api/event and
// only ever exposes registration_password as a boolean — never the plaintext code.
async function fetchEvent(eventId: string): Promise<EventPayload | null> {
  const base = supabaseAdmin()
    .from("events")
    .select("id, name, date, location, description, registration_password, registration_type, max_capacity, form_config");
  const { data, error } = await (eventId ? base.eq("id", eventId).eq("active", true) : base.eq("active", true)).single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    date: data.date,
    location: data.location,
    description: data.description,
    registration_type: (data.registration_type as "invite" | "form") ?? "invite",
    max_capacity: data.max_capacity ?? null,
    form_config: data.form_config ?? null,
    registration_password: !!data.registration_password,
  };
}

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.event;
  const eventId = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  // If the server fetch returns null (no event, or a transient error) the client
  // form falls back to its original /api/event fetch — behaviour is preserved.
  const initialEvent = await fetchEvent(eventId);

  return (
    <Suspense>
      <RegistrationForm initialEvent={initialEvent} />
    </Suspense>
  );
}
