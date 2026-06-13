"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Registration = {
  id: string;
  name: string;
  email: string;
  qr_token: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
};

type ArchivedEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  total: number;
  checked_in: number;
};

type ScanResult = {
  status: "success" | "already_checked_in" | "error";
  name?: string;
  message?: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "list" | "tools" | "archiv">("scanner");

  // Tools state
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [eventPassword, setEventPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Archive state
  const [archivedEvents, setArchivedEvents] = useState<ArchivedEvent[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  const scannerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");
  const savedPassword = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<Record<string, AudioBuffer>>({});

  const loadRegistrations = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch(`/api/registrations?password=${encodeURIComponent(pw)}`);
    const data = await res.json();
    if (data.registrations) {
      setRegistrations(data.registrations);
      setEvent(data.event);
    }
    setLoading(false);
  }, []);

  const loadArchive = useCallback(async () => {
    if (archiveLoaded) return;
    setArchiveLoading(true);
    const res = await fetch(`/api/archive?password=${encodeURIComponent(savedPassword.current)}`);
    const data = await res.json();
    if (data.events) setArchivedEvents(data.events);
    setArchiveLoading(false);
    setArchiveLoaded(true);
  }, [archiveLoaded]);

  useEffect(() => {
    if (activeTab === "archiv") loadArchive();
  }, [activeTab, loadArchive]);

  // Auto-login from sessionStorage on page reload
  useEffect(() => {
    const stored = sessionStorage.getItem("adminPw");
    if (!stored) return;
    fetch("/api/registrations?password=" + encodeURIComponent(stored)).then(async (res) => {
      if (res.status === 401) { sessionStorage.removeItem("adminPw"); return; }
      const data = await res.json();
      savedPassword.current = stored;
      setAuthenticated(true);
      setRegistrations(data.registrations || []);
      setEvent(data.event || null);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/registrations?password=" + encodeURIComponent(password));
    if (res.status === 401) { setAuthError("Falsches Passwort."); return; }
    savedPassword.current = password;
    sessionStorage.setItem("adminPw", password);
    setAuthenticated(true);
    const data = await res.json();
    setRegistrations(data.registrations || []);
    setEvent(data.event || null);
  };

  const unlockAndLoadAudio = async () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    await Promise.all(
      (["correct", "wrong"] as const).map(async (name) => {
        const res = await fetch(`/sounds/${name}.wav`);
        const buf = await res.arrayBuffer();
        soundBuffers.current[name] = await ctx.decodeAudioData(buf);
      })
    );
  };

  const playSound = (type: "correct" | "wrong") => {
    const ctx = audioCtxRef.current;
    const buf = soundBuffers.current[type];
    if (!ctx || !buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  };

  const handleScan = async (token: string) => {
    const clean = token.includes("/ticket/") ? token.split("/ticket/")[1] : token;
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: clean, adminPassword: savedPassword.current }),
    });
    const data = await res.json();
    if (!res.ok) {
      playSound("wrong");
      setScanResult({ status: "error", message: data.error });
    } else {
      if (data.status === "success") {
        playSound("correct");
        loadRegistrations(savedPassword.current);
      } else {
        playSound("wrong");
      }
      setScanResult({ status: data.status, name: data.name });
    }
    setTimeout(() => setScanResult(null), 4000);
  };

  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    import("jsqr").then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
        setTimeout(() => { lastScanRef.current = ""; }, 3000);
      }
    });
    rafRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = useCallback(async () => {
    await unlockAndLoadAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setScanResult({ status: "error", message: "Kamera konnte nicht gestartet werden." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  useEffect(() => { return () => { stopScanner(); }; }, [stopScanner]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus(null);
    setResendLoading(true);
    const res = await fetch("/api/resend-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail, adminPassword: savedPassword.current }),
    });
    const data = await res.json();
    setResendLoading(false);
    if (!res.ok) {
      setResendStatus({ ok: false, msg: data.error });
    } else {
      setResendStatus({ ok: true, msg: `Code erneut gesendet an ${data.name}.` });
      setResendEmail("");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    setPwLoading(true);
    const res = await fetch("/api/admin/event", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: savedPassword.current,
        registration_password: eventPassword || null,
      }),
    });
    setPwLoading(false);
    if (!res.ok) {
      setPwStatus({ ok: false, msg: "Fehler beim Speichern." });
    } else {
      setPwStatus({
        ok: true,
        msg: eventPassword ? `Passwort gesetzt: „${eventPassword}"` : "Passwortschutz entfernt.",
      });
      setEventPassword("");
    }
  };

  const exportUrl = (eventId: string, type: string) =>
    `/api/export?password=${encodeURIComponent(savedPassword.current)}&type=${type}&eventId=${eventId}`;

  const checkedInCount = registrations.filter((r) => r.checked_in).length;

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">Impact Gstaad</p>
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin-Passwort"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              {authError && <p className="text-sm text-red-600">{authError}</p>}
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition">
                Anmelden
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Admin</p>
          <h1 className="text-xl font-bold text-gray-900">{event?.name || "Kein aktiver Event"}</h1>
        </div>
        <button
          onClick={() => loadRegistrations(savedPassword.current)}
          className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
        >
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Angemeldet</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Eingecheckt</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{registrations.length - checkedInCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Ausstehend</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4 gap-1">
        {(["scanner", "list", "tools", "archiv"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition capitalize ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {tab === "scanner" ? "Scanner" : tab === "list" ? "Gäste" : tab === "tools" ? "Tools" : "Archiv"}
          </button>
        ))}
      </div>

      {/* Scanner Tab */}
      {activeTab === "scanner" && (
        <div className="space-y-3">
          {/* Ergebnis-Banner — dominant, sofort sichtbar */}
          <div className={`rounded-2xl transition-all duration-200 overflow-hidden ${
            scanResult
              ? scanResult.status === "success"
                ? "bg-green-500"
                : scanResult.status === "already_checked_in"
                ? "bg-red-500"
                : "bg-red-500"
              : "bg-gray-100"
          }`}
            style={{ minHeight: scanResult ? 120 : 72 }}
          >
            {scanResult ? (
              <div className="flex flex-col items-center justify-center py-7 px-4 text-center">
                <p className="text-4xl mb-1">
                  {scanResult.status === "success" ? "✓" : "✗"}
                </p>
                <p className="text-white font-bold text-xl leading-tight">
                  {scanResult.status === "success" && scanResult.name}
                  {scanResult.status === "already_checked_in" && scanResult.name}
                  {scanResult.status === "error" && (scanResult.message || "Ungültiger QR-Code")}
                </p>
                {scanResult.status === "already_checked_in" && (
                  <p className="text-red-100 text-sm font-medium mt-1">Bereits eingecheckt</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-5">
                <p className="text-gray-400 text-sm">
                  {scanning ? "QR-Code vor die Kamera halten…" : "Kamera starten um zu scannen"}
                </p>
              </div>
            )}
          </div>

          {/* Kleines Kamerabild */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
            <div ref={scannerRef} className="rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center aspect-square">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover rounded-xl ${scanning ? "block" : "hidden"}`}
              />
              <canvas ref={canvasRef} className="hidden" />
              {!scanning && <p className="text-gray-400 text-sm">Kamera noch nicht aktiv</p>}
            </div>
            <div className="mt-3">
              {!scanning ? (
                <button onClick={startScanner} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition">
                  Kamera starten
                </button>
              ) : (
                <button onClick={stopScanner} className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition">
                  Stoppen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Lädt…</div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Noch keine Anmeldungen.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {registrations.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.checked_in ? "bg-green-400" : "bg-gray-200"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.email}</p>
                  </div>
                  {r.checked_in && <span className="text-xs text-green-600 font-medium flex-shrink-0">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {/* Event-Passwort setzen */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Anmeldeseite sperren</h2>
            <p className="text-xs text-gray-400 mb-4">
              Mitglieder brauchen diesen Code um sich anzumelden. Leer lassen = offen.
            </p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <input
                type="text"
                value={eventPassword}
                onChange={(e) => setEventPassword(e.target.value)}
                placeholder="Neuer Einladungscode (leer = kein Schutz)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
              />
              {pwStatus && (
                <div className={`rounded-xl px-4 py-3 ${pwStatus.ok ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                  <p className={`text-sm ${pwStatus.ok ? "text-green-700" : "text-red-600"}`}>{pwStatus.msg}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition disabled:opacity-40"
              >
                {pwLoading ? "Speichert…" : "Speichern"}
              </button>
            </form>
          </div>

          {/* QR-Code erneut senden */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">QR-Code erneut senden</h2>
            <p className="text-xs text-gray-400 mb-4">Für Gäste, die ihren Code verloren haben.</p>
            <form onSubmit={handleResend} className="space-y-3">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="E-Mail-Adresse des Gastes"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
              />
              {resendStatus && (
                <div className={`rounded-xl px-4 py-3 ${resendStatus.ok ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                  <p className={`text-sm ${resendStatus.ok ? "text-green-700" : "text-red-600"}`}>{resendStatus.msg}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={resendLoading}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition disabled:opacity-40"
              >
                {resendLoading ? "Wird gesendet…" : "Code erneut senden"}
              </button>
            </form>
          </div>

          {/* CSV Export */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">CSV-Export</h2>
            <p className="text-xs text-gray-400 mb-4">Aktueller Event.</p>
            <div className="space-y-2">
              {[
                { type: "all", label: "Alle Registrierten", count: registrations.length },
                { type: "checkedin", label: "Eingecheckte", count: checkedInCount },
                { type: "noshows", label: "No-Shows", count: registrations.length - checkedInCount },
              ].map(({ type, label, count }) => (
                <a
                  key={type}
                  href={`/api/export?password=${encodeURIComponent(savedPassword.current)}&type=${type}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <span>{label}</span>
                  <span className="text-gray-400 text-xs">{count} Personen</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Archiv Tab */}
      {activeTab === "archiv" && (
        <div className="space-y-3">
          {archiveLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">Lädt…</div>
          ) : archivedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
              Noch keine archivierten Events.
            </div>
          ) : (
            archivedEvents.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ev.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(ev.date).toLocaleDateString("de-CH", {
                        day: "numeric", month: "long", year: "numeric",
                      })} · {ev.location}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{ev.checked_in} / {ev.total}</p>
                    <p className="text-xs text-gray-400">Check-ins</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[
                    { type: "all", label: "Alle" },
                    { type: "checkedin", label: "Eingecheckt" },
                    { type: "noshows", label: "No-Shows" },
                  ].map(({ type, label }) => (
                    <a
                      key={type}
                      href={`/api/export?password=${encodeURIComponent(savedPassword.current)}&type=${type}&eventId=${ev.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
