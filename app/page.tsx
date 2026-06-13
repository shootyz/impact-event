"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string | null;
};

export default function RegistrationPage() {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
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
    const res = await fetch("/api/event-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: gatePassword }),
    });
    const data = await res.json();
    setGateLoading(false);
    if (!res.ok) { setGateError(data.error || "Wrong code."); return; }
    setUnlocked(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address."); return; }
    if (email.toLowerCase() !== emailConfirm.toLowerCase()) { setError("Email addresses do not match."); return; }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${vorname.trim()} ${nachname.trim()}`, email }),
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

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-16 overflow-x-hidden" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-md mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Impact Gstaad" className="h-12 mx-auto mb-8 object-contain" />
          {/* Gold divider */}
          <div className="h-px mb-8" style={{ background: "var(--ig-gray2)" }} />
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ig-gold)" }}>
            Event Registration
          </p>
          {eventLoading ? (
            <div className="h-6 rounded animate-pulse w-48 mx-auto" style={{ background: "var(--ig-gray2)" }} />
          ) : event ? (
            <h1 className="text-2xl font-bold" style={{ color: "var(--ig-navy)" }}>{event.name}</h1>
          ) : (
            <p className="text-red-500 text-sm">No active event.</p>
          )}
        </div>

        {/* Password gate */}
        {event && !unlocked && (
          <div className="rounded-2xl border p-8 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
            <p className="text-sm text-center mb-6" style={{ color: "var(--ig-gray3)" }}>
              This event is for invited members only.
            </p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                placeholder="Invite code"
                required
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition"
                style={{
                  border: "1.5px solid var(--ig-gray2)",
                  color: "var(--ig-black)",
                  background: "var(--ig-light)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
              />
              {gateError && <p className="text-sm text-red-500">{gateError}</p>}
              <button
                type="submit"
                disabled={gateLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white tracking-wide transition disabled:opacity-40"
                style={{ background: "var(--ig-navy)" }}
                onMouseEnter={e => !gateLoading && (e.currentTarget.style.background = "var(--ig-gold)")}
                onMouseLeave={e => e.currentTarget.style.background = "var(--ig-navy)"}
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
              {event.description && (
                <div className="px-6 pb-5 pt-0">
                  <div className="h-px mb-4" style={{ background: "var(--ig-gray2)" }} />
                  <p className="text-sm" style={{ color: "var(--ig-navy)" }}>{event.description}</p>
                </div>
              )}
            </div>

            {/* Form card */}
            <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First name", value: vorname, set: setVorname, placeholder: "Maria" },
                    { label: "Last name", value: nachname, set: setNachname, placeholder: "Muster" },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                        {label} <span style={{ color: "var(--ig-gold)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        placeholder={placeholder}
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)", background: "var(--ig-light)" }}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                      />
                    </div>
                  ))}
                </div>
                {[
                  { label: "Email", value: email, set: setEmail, placeholder: "name@example.com", confirm: false },
                  { label: "Confirm email", value: emailConfirm, set: setEmailConfirm, placeholder: "name@example.com", confirm: true },
                ].map(({ label, value, set, placeholder, confirm }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--ig-navy)" }}>
                      {label} <span style={{ color: "var(--ig-gold)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      required
                      onPaste={confirm ? (e) => e.preventDefault() : undefined}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)", background: "var(--ig-light)" }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
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
                  style={{ background: "var(--ig-navy)", marginTop: "8px" }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.background = "var(--ig-gold)")}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--ig-navy)"}
                >
                  {loading ? "Registering…" : "Register Now"}
                </button>
              </form>
            </div>

            <p className="text-center text-xs tracking-wide" style={{ color: "var(--ig-navy)" }}>
              You will receive your QR code by email.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
