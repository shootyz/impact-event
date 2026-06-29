"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type jsQRType from "jsqr";

type ScanResult = { status: "success" | "already_checked_in" | "error"; name?: string; message?: string };
type Registration = { id: string; name: string; email: string; checked_in: boolean; checked_in_at?: string; qr_token?: string };

export default function ScannerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [eventId, setEventId] = useState("");
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [eventName, setEventName] = useState("");

  // Scanner
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const jsQRRef = useRef<typeof jsQRType | null>(null);
  const lastScanRef = useRef("");

  // Registrations
  const [tab, setTab] = useState<"scanner" | "list">("scanner");
  const [regs, setRegs] = useState<Registration[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual registration
  const [showManual, setShowManual] = useState(false);
  const [manualFirst, setManualFirst] = useState("");
  const [manualLast, setManualLast] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMsg, setManualMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(p => setEventId(p.eventId));
  }, [params]);

  async function tryAuth(p: string) {
    setAuthError("");
    const res = await fetch("/api/scan/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, pin: p }),
    });
    const data = await res.json();
    if (!data.ok) { setAuthError("Falscher PIN."); return; }
    setAuthed(true);
    setPin(p);
    const evRes = await fetch(`/api/event?id=${eventId}`).catch(() => null);
    if (evRes?.ok) { const d = await evRes.json(); setEventName(d.name ?? ""); }
  }

  // Load registrations
  const loadRegs = useCallback(async () => {
    if (!authed || !eventId || !pin) return;
    setRegsLoading(true);
    const res = await fetch(`/api/registrations?eventId=${eventId}`, {
      headers: { "x-scanner-pin": pin },
    });
    if (res.ok) { const d = await res.json(); setRegs(d.registrations ?? d ?? []); }
    setRegsLoading(false);
  }, [authed, eventId, pin]);

  useEffect(() => { if (authed) loadRegs(); }, [authed, loadRegs]);

  // Scanner logic
  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const handleScan = useCallback(async (token: string) => {
    const clean = token.includes("/ticket/") ? token.split("/ticket/")[1] : token;
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: clean, scannerPin: pin, eventId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setScanResult({ status: "error", message: data.error });
    } else {
      setScanResult({ status: data.status, name: data.name });
      if (data.status === "success") loadRegs();
    }
    setTimeout(() => setScanResult(null), 2500);
  }, [pin, eventId, loadRegs]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick); return;
    }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const jsQR = jsQRRef.current;
    if (jsQR) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
        setTimeout(() => { lastScanRef.current = ""; }, 4000);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleScan]);

  const startScanner = useCallback(async () => {
    if (!jsQRRef.current) {
      const { default: jsQR } = await import("jsqr");
      jsQRRef.current = jsQR;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setScanResult({ status: "error", message: "Kamera konnte nicht gestartet werden." });
    }
  }, [tick]);

  async function handleCheckin(r: Registration) {
    setActionLoading(r.id + "-checkin");
    await fetch(`/api/guest/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked_in: !r.checked_in, scannerPin: pin }),
    });
    await loadRegs();
    setActionLoading(null);
  }

  async function handleDelete(r: Registration) {
    if (!confirm(`${r.name} wirklich löschen?`)) return;
    setActionLoading(r.id + "-delete");
    await fetch(`/api/guest/${r.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scannerPin: pin }),
    });
    setExpandedId(null);
    await loadRegs();
    setActionLoading(null);
  }

  // Manual registration
  async function submitManual() {
    if (!manualFirst.trim() || !manualLast.trim()) { setManualMsg({ ok: false, text: "Vor- und Nachname erforderlich." }); return; }
    setManualLoading(true); setManualMsg(null);
    const res = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${manualFirst.trim()} ${manualLast.trim()}`, email: manualEmail.trim() || undefined, eventId, scannerPin: pin }),
    });
    const d = await res.json();
    if (res.ok) {
      setManualMsg({ ok: true, text: `${manualFirst} ${manualLast} eingetragen.` });
      setManualFirst(""); setManualLast(""); setManualEmail("");
      loadRegs();
    } else {
      setManualMsg({ ok: false, text: d.error ?? "Fehler." });
    }
    setManualLoading(false);
  }

  const navy = "#1E3263", gold = "#D28D28", gray2 = "#D0DDEA", gray3 = "#5C7A94", light = "#F8F9FF";
  const inputCls = "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition";
  const inputStyle = { borderColor: gray2, color: navy, background: "white" };

  // ── PIN screen ──
  if (!authed) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: light }}>
      <img src="/logo.png" alt="Impact Gstaad" className="h-14 mb-8 object-contain" />
      <div className="w-full max-w-xs space-y-4">
        <p className="text-center text-sm font-semibold" style={{ color: navy }}>Scanner-PIN eingeben</p>
        <input
          type="number" inputMode="numeric" pattern="[0-9]*"
          className={inputCls} style={inputStyle}
          placeholder="PIN"
          value={pinInput}
          onChange={e => setPinInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && tryAuth(pinInput)}
        />
        {authError && <p className="text-sm text-center" style={{ color: "#dc2626" }}>{authError}</p>}
        <button
          onClick={() => tryAuth(pinInput)}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition hover:opacity-90"
          style={{ background: gold }}>
          Weiter
        </button>
      </div>
    </div>
  );

  const checkedIn = regs.filter(r => r.checked_in).length;
  const filteredRegs = regs.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()));

  // ── Main scanner UI ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: light }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: "white", borderColor: gray2 }}>
        <img src="/logo.png" alt="Impact Gstaad" className="h-7 object-contain" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: navy }}>{eventName || "Event"}</p>
          <p className="text-xs" style={{ color: gray3 }}>{checkedIn} / {regs.length} eingecheckt</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ background: "white", borderColor: gray2 }}>
        {(["scanner", "list"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold relative transition"
            style={{ color: tab === t ? gold : navy }}>
            {t === "scanner" ? "Scanner" : `Anmeldungen (${regs.length})`}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: gold }} />}
          </button>
        ))}
      </div>

      {/* Scanner tab */}
      {tab === "scanner" && (
        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-4 py-4 gap-4">
          <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ background: "white", borderColor: gray2 }}>
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <div className="relative overflow-hidden" style={{ aspectRatio: "1", maxHeight: "calc(100svh - 220px)" }}>
              <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`} />
              <canvas ref={canvasRef} className="hidden" />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: light }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "white", border: `1.5px solid ${gray2}` }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={navy} strokeWidth="1.6" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                  <p className="text-xs tracking-widest uppercase font-medium" style={{ color: gray3 }}>Kamera nicht aktiv</p>
                </div>
              )}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8">
                    {[["top-0 left-0 border-t-2 border-l-2 rounded-tl-lg"], ["top-0 right-0 border-t-2 border-r-2 rounded-tr-lg"], ["bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg"], ["bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg"]].map(([cls], i) => (
                      <div key={i} className={`absolute w-7 h-7 ${cls}`} style={{ borderColor: gold }} />
                    ))}
                  </div>
                </div>
              )}
              {scanResult && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
                  style={{ background: scanResult.status === "success" ? "rgba(22,163,74,0.95)" : scanResult.status === "already_checked_in" ? "rgba(234,179,8,0.95)" : "rgba(220,38,38,0.95)" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    {scanResult.status === "success"
                      ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : scanResult.status === "already_checked_in"
                      ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                  </div>
                  <div>
                    <p className="text-white font-bold text-2xl leading-tight">
                      {scanResult.status === "success" || scanResult.status === "already_checked_in" ? scanResult.name : (scanResult.message || "Ungültiger QR-Code")}
                    </p>
                    {scanResult.status === "already_checked_in" && <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>Bereits eingecheckt</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-4 border-t" style={{ borderColor: gray2 }}>
              {!scanning
                ? <button onClick={startScanner} className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase text-white transition hover:opacity-90" style={{ background: gold }}>
                    Kamera starten
                  </button>
                : <button onClick={stopScanner} className="w-full py-3 rounded-xl text-sm font-medium transition border" style={{ borderColor: gray2, color: navy, background: "white" }}>
                    Stoppen
                  </button>}
            </div>
          </div>
        </div>
      )}

      {/* Anmeldungen tab */}
      {tab === "list" && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3">
          {/* Manual registration toggle */}
          <button
            onClick={() => { setShowManual(o => !o); setManualMsg(null); }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border w-full text-left transition"
            style={{ background: "white", borderColor: showManual ? navy : gray2, color: navy }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="text-sm font-semibold">Gast manuell erfassen</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ml-auto transition-transform" style={{ transform: showManual ? "rotate(180deg)" : "none" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {showManual && (
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: "white", borderColor: gray2 }}>
              <div className="flex gap-2">
                <input className={inputCls} style={inputStyle} placeholder="Vorname *" value={manualFirst} onChange={e => setManualFirst(e.target.value)} onFocus={e => (e.currentTarget.style.borderColor = navy)} onBlur={e => (e.currentTarget.style.borderColor = gray2)} />
                <input className={inputCls} style={inputStyle} placeholder="Nachname *" value={manualLast} onChange={e => setManualLast(e.target.value)} onFocus={e => (e.currentTarget.style.borderColor = navy)} onBlur={e => (e.currentTarget.style.borderColor = gray2)} />
              </div>
              <input className={inputCls} style={inputStyle} placeholder="E-Mail (optional)" type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} onFocus={e => (e.currentTarget.style.borderColor = navy)} onBlur={e => (e.currentTarget.style.borderColor = gray2)} />
              {manualMsg && <p className="text-xs" style={{ color: manualMsg.ok ? "#16a34a" : "#dc2626" }}>{manualMsg.text}</p>}
              <button onClick={submitManual} disabled={manualLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: navy }}>
                {manualLoading ? "Wird eingetragen…" : "Eintragen"}
              </button>
            </div>
          )}

          <input
            className={inputCls} style={inputStyle}
            placeholder="Name oder E-Mail suchen…"
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = navy)}
            onBlur={e => (e.currentTarget.style.borderColor = gray2)}
          />
          <p className="text-xs" style={{ color: gray3 }}>{checkedIn} eingecheckt · {regs.length - checkedIn} ausstehend</p>

          <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: gray2 }}>
            {regsLoading ? (
              <div className="p-8 text-center text-sm" style={{ color: gray3 }}>Lädt…</div>
            ) : filteredRegs.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: gray3 }}>Keine Einträge.</div>
            ) : filteredRegs.map((r, i) => (
              <div key={r.id} style={{ borderBottom: i < filteredRegs.length - 1 ? `1px solid ${gray2}` : undefined }}>
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  style={{ background: expandedId === r.id ? light : "white" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: r.checked_in ? "#DCFCE7" : light, border: `1px solid ${r.checked_in ? "#86EFAC" : gray2}` }}>
                    {r.checked_in && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: navy }}>{r.name}</p>
                    <p className="text-xs truncate" style={{ color: gray3 }}>{r.email || "—"}</p>
                  </div>
                  {r.checked_in && r.checked_in_at && (
                    <p className="text-xs flex-shrink-0 mr-1" style={{ color: gray3 }}>
                      {new Date(r.checked_in_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gray3} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: expandedId === r.id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {/* Actions */}
                {expandedId === r.id && (
                  <div className="flex gap-2 px-4 pb-3" style={{ background: light }}>
                    <button
                      onClick={() => handleCheckin(r)}
                      disabled={actionLoading === r.id + "-checkin"}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                      style={{ background: r.checked_in ? "white" : navy, color: r.checked_in ? navy : "white", border: `1.5px solid ${r.checked_in ? gray2 : navy}` }}>
                      {actionLoading === r.id + "-checkin" ? "…" : r.checked_in ? "✓ Eingecheckt" : "Einchecken"}
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={actionLoading === r.id + "-delete"}
                      className="py-2 px-4 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                      style={{ background: "white", color: "#dc2626", border: "1.5px solid #fca5a5" }}>
                      {actionLoading === r.id + "-delete" ? "…" : "Löschen"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={loadRegs} className="text-xs self-center transition hover:opacity-70" style={{ color: gray3 }}>
            Aktualisieren
          </button>
        </div>
      )}
    </div>
  );
}
