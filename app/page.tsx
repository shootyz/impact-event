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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (email.toLowerCase() !== emailConfirm.toLowerCase()) {
      setError("Email addresses do not match.");
      return;
    }

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
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Impact Gstaad</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Registration</h1>
          {eventLoading ? (
            <div className="h-5 bg-gray-200 rounded animate-pulse w-48 mx-auto mt-2" />
          ) : event ? (
            <p className="text-gray-500 text-sm">{event.name}</p>
          ) : (
            <p className="text-red-500 text-sm">No active event.</p>
          )}
        </div>

        {/* Password gate */}
        {event && !unlocked && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-4 text-center">This event is for invited members only.</p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                placeholder="Invite code"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
              />
              {gateError && <p className="text-sm text-red-600">{gateError}</p>}
              <button
                type="submit"
                disabled={gateLoading}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {gateLoading ? "Checking…" : "Continue"}
              </button>
            </form>
          </div>
        )}

        {/* Registration form */}
        {event && unlocked && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900">{eventDate}</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900">{event.location}</p>
                </div>
              </div>
              {event.description && (
                <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">{event.description}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      First name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={vorname}
                      onChange={(e) => setVorname(e.target.value)}
                      placeholder="Maria"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Last name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nachname}
                      onChange={(e) => setNachname(e.target.value)}
                      placeholder="Muster"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={emailConfirm}
                    onChange={(e) => setEmailConfirm(e.target.value)}
                    placeholder="name@example.com"
                    required
                    onPaste={(e) => e.preventDefault()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Registering…" : "Register now"}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              You will receive your QR code by email.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
