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

type ScanResult = {
  status: "success" | "already_checked_in" | "error";
  name?: string;
  checked_in_at?: string;
  message?: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "list">("scanner");
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const savedPassword = useRef("");

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/registrations?password=" + encodeURIComponent(password));
    if (res.status === 401) {
      setAuthError("Falsches Passwort.");
      return;
    }
    savedPassword.current = password;
    setAuthenticated(true);
    const data = await res.json();
    setRegistrations(data.registrations || []);
    setEvent(data.event || null);
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
      setScanResult({ status: "error", message: data.error });
    } else {
      setScanResult({ status: data.status, name: data.name, checked_in_at: data.checked_in_at });
      if (data.status === "success") {
        loadRegistrations(savedPassword.current);
      }
    }
    setTimeout(() => setScanResult(null), 4000);
  };

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-scanner");
    html5QrRef.current = scanner;
    setScanning(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          handleScan(decodedText);
        },
        undefined
      );
    } catch {
      setScanning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const checkedInCount = registrations.filter((r) => r.checked_in).length;

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Impact Gstaad
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin-Passwort"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm"
                />
              </div>
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition"
              >
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
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Admin
          </p>
          <h1 className="text-xl font-bold text-gray-900">
            {event?.name || "Kein aktiver Event"}
          </h1>
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
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "scanner"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          QR-Scanner
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "list"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Gästeliste
        </button>
      </div>

      {/* Scanner Tab */}
      {activeTab === "scanner" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          {scanResult && (
            <div
              className={`rounded-xl px-4 py-3 mb-4 ${
                scanResult.status === "success"
                  ? "bg-green-50 border border-green-100"
                  : scanResult.status === "already_checked_in"
                  ? "bg-amber-50 border border-amber-100"
                  : "bg-red-50 border border-red-100"
              }`}
            >
              <p
                className={`font-semibold text-sm ${
                  scanResult.status === "success"
                    ? "text-green-700"
                    : scanResult.status === "already_checked_in"
                    ? "text-amber-700"
                    : "text-red-700"
                }`}
              >
                {scanResult.status === "success" && `✓ Willkommen, ${scanResult.name}!`}
                {scanResult.status === "already_checked_in" &&
                  `Bereits eingecheckt: ${scanResult.name}`}
                {scanResult.status === "error" &&
                  (scanResult.message || "Ungültiger QR-Code")}
              </p>
            </div>
          )}

          <div
            id="qr-scanner"
            ref={scannerRef}
            className="rounded-xl overflow-hidden bg-gray-50 min-h-[200px] flex items-center justify-center"
          >
            {!scanning && (
              <p className="text-gray-400 text-sm">Kamera wird gestartet…</p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition"
              >
                Kamera starten
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
              >
                Kamera stoppen
              </button>
            )}
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
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      r.checked_in ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.email}</p>
                  </div>
                  {r.checked_in && (
                    <span className="text-xs text-green-600 font-medium flex-shrink-0">
                      ✓ Check-in
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
