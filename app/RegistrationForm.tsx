"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { T, getLang } from "@/lib/i18n";
import logo from "@/public/logo.png";

type FormField = { id: string; type: "text" | "textarea" | "select" | "checkbox"; label: string; required: boolean; visible: boolean; options?: string[] };
type FormConfig = { intro: string; fields: FormField[] };

export type EventPayload = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string | null;
  registration_type: "invite" | "form";
  max_capacity: number | null;
  form_config: FormConfig | null;
  // boolean flag (never the plaintext password) indicating whether a code gate is set
  registration_password?: boolean;
};

export default function RegistrationForm({ initialEvent }: { initialEvent: EventPayload | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = getLang(searchParams);
  const t = T[lang];
  const eventId = searchParams.get("event") ?? "";

  const [event, setEvent] = useState<EventPayload | null>(initialEvent);
  // When the server already provided the event we render it immediately; otherwise
  // we fall back to the original client fetch below.
  const [eventLoading, setEventLoading] = useState(initialEvent === null);
  const [unlocked, setUnlocked] = useState(
    initialEvent ? (!initialEvent.registration_password || initialEvent.registration_type === "form") : false
  );
  const [gateCode, setGateCode] = useState(searchParams.get("code") ?? "");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [inviteCodeId] = useState<string | null>(null);
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [nameLocked] = useState(false);
  const [emailLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Form-type registration
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState(false);
  const [formCapacityFull, setFormCapacityFull] = useState(false);

  useEffect(() => {
    // Server already supplied the event — no client fetch needed.
    if (initialEvent) return;
    // Fallback: original client-side fetch (unchanged behaviour).
    const url = eventId ? `/api/event?id=${encodeURIComponent(eventId)}` : "/api/event";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setEvent(data);
          if (!data.registration_password || data.registration_type === "form") setUnlocked(true);
        }
        setEventLoading(false);
      });
  }, [eventId, initialEvent]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    setGateLoading(true);

    const authRes = await fetch("/api/event-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: gateCode, ...(eventId ? { eventId } : {}) }),
    });
    const authData = await authRes.json();
    setGateLoading(false);
    if (!authRes.ok) { setGateError(authData.error || t.invalidCode); return; }
    setUnlocked(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!vorname.trim() || !nachname.trim()) { setError(t.errorName); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) { setError(t.errorEmail); return; }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${vorname.trim()} ${nachname.trim()}`,
        email,
        invite_code_id: inviteCodeId,
        lang,
        ...(eventId ? { event_id: eventId } : {}),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 409 && data.token) {
        router.push(`/success/${data.token}?lang=${lang}${eventId ? `&event=${eventId}` : ""}&already=1`);
        return;
      }
      setError(data.error || t.errorGeneric);
      return;
    }
    router.push(`/success/${data.token}?lang=${lang}${eventId ? `&event=${eventId}` : ""}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!vorname.trim() || !nachname.trim()) { setError(t.errorName); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) { setError(t.errorEmail); return; }
    // Validate required custom fields
    const activeFields = (event?.form_config?.fields ?? []).filter(f => f.visible);
    for (const f of activeFields) {
      if (f.required && !formValues[f.id]?.trim()) {
        setError(`Bitte füllen Sie das Feld "${f.label}" aus.`);
        return;
      }
    }
    setLoading(true);
    const extraFields: Record<string, string> = {};
    for (const f of activeFields) {
      if (formValues[f.id]?.trim()) extraFields[f.id] = formValues[f.id].trim();
    }
    const res = await fetch("/api/form-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        first_name: vorname.trim(),
        last_name: nachname.trim(),
        email,
        company: extraFields.company || null,
        message: extraFields.message || null,
        extra_fields: extraFields,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 409 && data.error === "capacity_full") { setFormCapacityFull(true); return; }
      setError(data.error || t.errorGeneric);
      return;
    }
    // Redirect to ticket page if qr_token returned, otherwise show success
    if (data.qr_token) {
      router.push(`/success/${data.qr_token}?lang=${lang}${eventId ? `&event=${eventId}` : ""}`);
    } else {
      setFormSuccess(true);
    }
  };

  const eventDate = event
    ? new Date(event.date).toLocaleDateString(t.dateLocale, {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const inputStyle = { border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)", background: "var(--ig-light)" };

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-16" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-md mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <Image src={logo} alt="Impact Gstaad" priority className="h-12 w-auto mx-auto mb-8 object-contain" />
          <div className="h-px mb-8" style={{ background: "var(--ig-gray2)" }} />
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ig-gold)" }}>
            {t.eventRegistration}
          </p>
          {eventLoading ? (
            <div className="h-6 rounded animate-pulse w-48 mx-auto" style={{ background: "var(--ig-gray2)" }} />
          ) : event ? (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "var(--ig-navy)" }}>{event.name}</h1>
              {event.description && (
                <p className="text-sm mt-2" style={{ color: "var(--ig-gray3)" }}>{event.description}</p>
              )}
            </>
          ) : (
            <p className="text-red-500 text-sm">{t.noActiveEvent}</p>
          )}
        </div>

        {/* Code gate */}
        {event && !unlocked && (
          <div className="rounded-2xl border p-8 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
            <p className="text-sm text-center mb-6" style={{ color: "var(--ig-gray3)" }}>
              {t.enterCode}
            </p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                placeholder={t.codePlaceholder}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition text-center tracking-widest uppercase font-semibold"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
              />
              {gateError && <p className="text-sm text-red-500">{gateError}</p>}
              <button
                type="submit"
                disabled={gateLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white tracking-wide transition disabled:opacity-40"
                style={{ background: "var(--ig-gold)" }}
                onMouseEnter={e => !gateLoading && (e.currentTarget.style.background = "#B8791F")}
                onMouseLeave={e => e.currentTarget.style.background = "var(--ig-gold)"}
              >
                {gateLoading ? t.checking : t.continue}
              </button>
            </form>
          </div>
        )}

        {/* Capacity full (form events) */}
        {event && formCapacityFull && (
          <div className="rounded-2xl border p-8 text-center shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
            <div className="text-4xl mb-4">🎟️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--ig-navy)" }}>Maximale Gästeanzahl erreicht</h2>
            <p className="text-sm" style={{ color: "var(--ig-gray3)" }}>
              Leider sind alle verfügbaren Plätze für diesen Event bereits vergeben.
            </p>
          </div>
        )}

        {/* Form-type success */}
        {event && formSuccess && (
          <div className="rounded-2xl border p-8 text-center shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--ig-navy)" }}>Vielen Dank!</h2>
            <p className="text-sm" style={{ color: "var(--ig-gray3)" }}>
              Ihre Anmeldung wurde erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.
            </p>
          </div>
        )}

        {/* Registration form */}
        {event && unlocked && !formCapacityFull && !formSuccess && (
          <div className="space-y-4">
            {/* Event info card */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, var(--ig-navy), var(--ig-gold))` }} />
              <div className="px-6 py-5 flex gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1.5" style={{ color: "var(--ig-gray3)" }}>{t.date}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--ig-navy)" }}>{eventDate}</p>
                </div>
                <div className="w-px" style={{ background: "var(--ig-gray2)" }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1.5" style={{ color: "var(--ig-gray3)" }}>{t.location}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--ig-navy)" }}>{event.location}</p>
                </div>
              </div>
            </div>

            {/* Intro text (form events) */}
            {event?.registration_type === "form" && event.form_config?.intro && (
              <p className="text-sm text-center" style={{ color: "var(--ig-gray3)" }}>{event.form_config.intro}</p>
            )}

            {/* Form card */}
            <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
              {inviteCodeId && (
                <div className="rounded-xl px-4 py-3 mb-4 text-sm font-medium" style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1px solid var(--ig-gray2)" }}>
                  {t.welcome(vorname)}
                </div>
              )}
              <form onSubmit={event?.registration_type === "form" ? handleFormSubmit : handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t.firstName, value: vorname, set: setVorname, placeholder: t.firstNamePlaceholder, locked: nameLocked, autoComplete: "given-name" },
                    { label: t.lastName, value: nachname, set: setNachname, placeholder: t.lastNamePlaceholder, locked: nameLocked, autoComplete: "family-name" },
                  ].map(({ label, value, set, placeholder, locked, autoComplete }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                        {label} <span style={{ color: "var(--ig-gold)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        autoComplete={autoComplete}
                        value={value}
                        onChange={(e) => !locked && set(e.target.value)}
                        placeholder={placeholder}
                        readOnly={locked}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ ...inputStyle, opacity: locked ? 0.7 : 1, cursor: locked ? "default" : "text" }}
                        onFocus={e => !locked && (e.currentTarget.style.borderColor = "var(--ig-navy)")}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                    {t.email} <span style={{ color: "var(--ig-gold)" }}>*</span>
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => !emailLocked && setEmail(e.target.value)}
                    placeholder="name@example.com"
                    readOnly={emailLocked}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ ...inputStyle, opacity: emailLocked ? 0.7 : 1, cursor: emailLocked ? "default" : "text" }}
                    onFocus={e => !emailLocked && (e.currentTarget.style.borderColor = "var(--ig-navy)")}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                  />
                </div>
                {event?.registration_type === "form" && (() => {
                  const STANDARD_IDS = new Set(["vorname", "nachname", "email"]);
                  const fields = (event.form_config?.fields ?? [
                    { id: "company", type: "text" as const, label: "Firma / Organisation", required: false, visible: true },
                    { id: "message", type: "textarea" as const, label: "Nachricht", required: false, visible: true },
                  ]).filter(f => f.visible && !STANDARD_IDS.has(f.id));
                  return fields.map(f => (
                    <div key={f.id}>
                      {f.type !== "checkbox" && (
                        <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                          {f.label} {f.required && <span style={{ color: "var(--ig-gold)" }}>*</span>}
                        </label>
                      )}
                      {f.type === "textarea" ? (
                        <textarea
                          value={formValues[f.id] ?? ""}
                          onChange={e => setFormValues(v => ({ ...v, [f.id]: e.target.value }))}
                          placeholder={f.required ? "" : "Optional"}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                          style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                          onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                        />
                      ) : f.type === "select" ? (
                        <select
                          value={formValues[f.id] ?? ""}
                          onChange={e => setFormValues(v => ({ ...v, [f.id]: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                          style={{ ...inputStyle, appearance: "auto" as React.CSSProperties["appearance"] }}
                        >
                          <option value="">— bitte wählen —</option>
                          {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === "checkbox" ? (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formValues[f.id] === "true"}
                            onChange={e => setFormValues(v => ({ ...v, [f.id]: e.target.checked ? "true" : "false" }))}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: "var(--ig-gold)" }}
                          />
                          <span className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--ig-navy)" }}>
                            {f.label} {f.required && <span style={{ color: "var(--ig-gold)" }}>*</span>}
                          </span>
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={formValues[f.id] ?? ""}
                          onChange={e => setFormValues(v => ({ ...v, [f.id]: e.target.value }))}
                          placeholder={f.required ? "" : "Optional"}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                          style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                          onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                        />
                      )}
                    </div>
                  ));
                })()}

                {error && (
                  <div className="rounded-xl px-4 py-3 border border-red-100 bg-red-50">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-semibold text-sm text-white tracking-widest uppercase transition disabled:opacity-40"
                  style={{ background: "var(--ig-gold)", marginTop: "8px" }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.background = "#B8791F")}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--ig-gold)"}
                >
                  {loading ? t.registering : t.registerNow}
                </button>
              </form>
            </div>

            {event?.registration_type !== "form" && (
              <p className="text-center text-xs tracking-wide" style={{ color: "var(--ig-navy)" }}>
                {t.ticketByEmail}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
