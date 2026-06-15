"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string | null;
};

function RegistrationPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [gateCode, setGateCode] = useState(searchParams.get("code") ?? "");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [inviteCodeId, setInviteCodeId] = useState<string | null>(null);
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/event")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setEvent(data);
          if (!data.registration_password) setUnlocked(true);
        }
        setEventLoading(false);
      });
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    setGateLoading(true);

    const authRes = await fetch("/api/event-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: gateCode }),
    });
    const authData = await authRes.json();
    setGateLoading(false);
    if (!authRes.ok) { setGateError(authData.error || "Invalid code."); return; }
    setUnlocked(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!vorname.trim() || !nachname.trim()) { setError("Please enter your first and last name."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address."); return; }
    if (email.toLowerCase() !== emailConfirm.toLowerCase()) { setError("Email addresses do not match."); return; }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${vorname.trim()} ${nachname.trim()}`, email, invite_code_id: inviteCodeId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Something went wrong."); return; }
    router.push(`/success/${data.token}`);
  };

  const eventDate = event
    ? new Date(event.date).toLocaleDateString("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const inputStyle = { border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)", background: "var(--ig-light)" };

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-16" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-md mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Impact Gstaad" className="h-12 mx-auto mb-8 object-contain" />
          <div className="h-px mb-8" style={{ background: "var(--ig-gray2)" }} />
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ig-gold)" }}>
            Event Registration
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
            <p className="text-red-500 text-sm">No active event.</p>
          )}
        </div>

        {/* Code gate */}
        {event && !unlocked && (
          <div className="rounded-2xl border p-8 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
            <p className="text-sm text-center mb-6" style={{ color: "var(--ig-gray3)" }}>
              Please enter the event code to continue.
            </p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="text"
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                placeholder="Event code"
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
                {gateLoading ? "Checking…" : "Continue"}
              </button>
            </form>
          </div>
        )}

        {/* Registration form */}
        {event && unlocked && (
          <div className="space-y-4">
            {/* Event info card */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, var(--ig-navy), var(--ig-gold))` }} />
              <div className="px-6 py-5 flex gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1.5" style={{ color: "var(--ig-gray3)" }}>Date</p>
                  <p className="text-sm font-medium" style={{ color: "var(--ig-navy)" }}>{eventDate}</p>
                </div>
                <div className="w-px" style={{ background: "var(--ig-gray2)" }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1.5" style={{ color: "var(--ig-gray3)" }}>Location</p>
                  <p className="text-sm font-medium" style={{ color: "var(--ig-navy)" }}>{event.location}</p>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
              {inviteCodeId && (
                <div className="rounded-xl px-4 py-3 mb-4 text-sm font-medium" style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1px solid var(--ig-gray2)" }}>
                  Welcome, {vorname}! Your details are pre-filled from your invitation.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First name", value: vorname, set: setVorname, placeholder: "Maria", locked: nameLocked },
                    { label: "Last name", value: nachname, set: setNachname, placeholder: "Muster", locked: nameLocked },
                  ].map(({ label, value, set, placeholder, locked }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                        {label} <span style={{ color: "var(--ig-gold)" }}>*</span>
                      </label>
                      <input
                        type="text"
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
                {[
                  { label: "Email", value: email, set: setEmail, placeholder: "name@example.com", locked: emailLocked, confirm: false },
                  { label: "Confirm email", value: emailConfirm, set: setEmailConfirm, placeholder: "name@example.com", locked: emailLocked, confirm: true },
                ].map(({ label, value, set, placeholder, locked, confirm }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                      {label} <span style={{ color: "var(--ig-gold)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => !locked && set(e.target.value)}
                      placeholder={placeholder}
                      readOnly={locked}
                      onPaste={confirm && !locked ? (e) => e.preventDefault() : undefined}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ ...inputStyle, opacity: locked ? 0.7 : 1, cursor: locked ? "default" : "text" }}
                      onFocus={e => !locked && (e.currentTarget.style.borderColor = "var(--ig-navy)")}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                    />
                  </div>
                ))}

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
                  {loading ? "Registering…" : "Register Now"}
                </button>
              </form>
            </div>

            <p className="text-center text-xs tracking-wide" style={{ color: "var(--ig-navy)" }}>
              You will receive your ticket by email.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense>
      <RegistrationPageInner />
    </Suspense>
  );
}
