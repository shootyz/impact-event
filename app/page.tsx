import { redirect } from "next/navigation";
import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { getLang, resolveLangField } from "@/lib/i18n";
import RegistrationForm, { type EventPayload } from "./RegistrationForm";

// Fetch the event server-side so its name/date/location are in the initial HTML
// (faster first paint, especially on mobile). Mirrors the shape of /api/event and
// only ever exposes registration_password as a boolean — never the plaintext code.
async function fetchEvent(eventId: string, rawLang: string | undefined): Promise<EventPayload | null> {
  const base = supabaseAdmin()
    .from("events")
    .select("id, name, name_en, name_fr, date, location, location_en, location_fr, description, description_en, description_fr, registration_password, registration_type, max_capacity, form_config");
  const { data, error } = await (eventId ? base.eq("id", eventId).eq("active", true) : base.eq("active", true)).single();
  if (error || !data) return null;
  // getLang defaults to "en" unless the param is explicitly "de"/"fr" — matches the client
  const lang = getLang({ get: (k: string) => (k === "lang" ? rawLang ?? null : null) });
  return {
    id: data.id,
    name: resolveLangField(lang, data.name, data.name_en, data.name_fr),
    date: data.date,
    location: resolveLangField(lang, data.location, data.location_en, data.location_fr),
    description: resolveLangField(lang, data.description, data.description_en, data.description_fr),
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
  if (!eventId) redirect("/admin");
  const rawLang = sp.lang;
  const lang = Array.isArray(rawLang) ? rawLang[0] : rawLang;
  const initialEvent = await fetchEvent(eventId, lang);

  return (
    <Suspense>
      <RegistrationForm initialEvent={initialEvent} />
    </Suspense>
  );
}
