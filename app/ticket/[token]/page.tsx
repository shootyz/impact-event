"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

type TicketInfo = {
  name: string;
  event: { name: string; date: string; location: string };
};

export default function TicketPage() {
  const { token } = useParams<{ token: string }>();
  const [qrUrl, setQrUrl] = useState("");
  const [info, setInfo] = useState<TicketInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    const ticketUrl = `${window.location.origin}/ticket/${token}`;
    QRCode.toDataURL(ticketUrl, { width: 340, margin: 2, color: { dark: "#1E3263", light: "#FFFFFF" } }).then(setQrUrl);
    fetch(`/api/ticket/${token}`).then((r) => r.json()).then((d) => { if (!d.error) setInfo(d); });
  }, [token]);

  const eventDate = info?.event?.date
    ? new Date(info.event.date).toLocaleDateString("de-CH", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .ticket-card { box-shadow: none !important; border: 1px solid #D0DDEA !important; }
        }
      `}</style>

      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 no-print-bg"
        style={{ background: "var(--ig-light)" }}
      >
        <div className="w-full max-w-xs">

          {/* Ticket card */}
          <div
            className="ticket-card rounded-3xl overflow-hidden shadow-xl border"
            style={{ background: "white", borderColor: "var(--ig-gray2)" }}
          >
            {/* Navy header strip */}
            <div className="px-6 pt-6 pb-5" style={{ background: "var(--ig-navy)" }}>
              <img src="/logo.png" alt="Impact Gstaad" className="h-7 object-contain mb-4" />
              {info ? (
                <>
                  <h2 className="text-lg font-bold text-white leading-tight">{info.event.name}</h2>
                  {eventDate && <p className="text-xs mt-1" style={{ color: "var(--ig-gray3)" }}>{eventDate}</p>}
                  <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>{info.event.location}</p>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-5 w-48 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <div className="h-3 w-32 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
                </div>
              )}
            </div>

            {/* Gold divider line */}
            <div className="h-0.5 w-full" style={{ background: "var(--ig-gold)" }} />

            {/* QR section */}
            <div className="px-6 py-6">
              {info && (
                <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--ig-gray3)" }}>
                  Ticket für
                </p>
              )}
              {info && (
                <p className="text-base font-semibold mb-4" style={{ color: "var(--ig-navy)" }}>{info.name}</p>
              )}
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-full rounded-xl" />
              ) : (
                <div className="w-full aspect-square rounded-xl animate-pulse" style={{ background: "var(--ig-light)" }} />
              )}
              <p className="text-xs mt-3 font-mono text-center break-all" style={{ color: "var(--ig-gray3)" }}>
                {token?.substring(0, 8)}…
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-1 border-t" style={{ borderColor: "var(--ig-gray2)" }}>
              <p className="text-xs text-center" style={{ color: "var(--ig-gray3)" }}>
                Show this QR code at the entrance
              </p>
            </div>
          </div>

          {/* Save as PDF button */}
          <button
            onClick={() => window.print()}
            className="no-print mt-5 w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
            style={{ background: "var(--ig-navy)", color: "white", border: "1px solid var(--ig-navy)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-gold)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gold)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Als PDF speichern
          </button>
        </div>
      </main>
    </>
  );
}
