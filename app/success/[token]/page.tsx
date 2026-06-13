"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

type TicketInfo = {
  name: string;
  event: { name: string; date: string; location: string };
};

export default function SuccessPage() {
  const { token } = useParams<{ token: string }>();
  const [qrUrl, setQrUrl] = useState("");
  const [info, setInfo] = useState<TicketInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    const ticketUrl = `${window.location.origin}/ticket/${token}`;
    QRCode.toDataURL(ticketUrl, { width: 340, margin: 2, color: { dark: "#1E3263", light: "#FFFFFF" } }).then(setQrUrl);
    fetch(`/api/ticket/${token}`).then(r => r.json()).then(d => { if (!d.error) setInfo(d); });
  }, [token]);

  const eventDate = info?.event?.date
    ? new Date(info.event.date).toLocaleDateString("de-CH", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-xs sm:max-w-2xl">

        {/* Success badge */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--ig-navy)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: "var(--ig-gold)" }}>
            Registration confirmed
          </p>
          <p className="text-sm" style={{ color: "var(--ig-navy)" }}>
            Your QR code has been sent by email.
          </p>
        </div>

        {/* Ticket card */}
        <div className="rounded-3xl overflow-hidden shadow-xl border" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>

          {/* ── DESKTOP: landscape ── */}
          <div className="hidden sm:flex">
            {/* Left: info */}
            <div className="flex-1 flex flex-col px-8 pt-8 pb-8 border-r" style={{ borderColor: "var(--ig-gray2)" }}>
              <img src="/logo.png" alt="Impact Gstaad" className="h-8 object-contain object-left mb-6" />
              {info ? (
                <>
                  <h2 className="text-2xl font-bold leading-tight mb-2" style={{ color: "var(--ig-navy)" }}>{info.event.name}</h2>
                  {eventDate && <p className="text-sm mb-1" style={{ color: "var(--ig-navy)" }}>{eventDate}</p>}
                  <p className="text-sm" style={{ color: "var(--ig-navy)" }}>{info.event.location}</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-6 w-56 rounded animate-pulse" style={{ background: "var(--ig-gray2)" }} />
                  <div className="h-4 w-40 rounded animate-pulse" style={{ background: "var(--ig-gray2)" }} />
                </div>
              )}
              <div className="my-6 h-px" style={{ background: "var(--ig-gold)" }} />
              {info && <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--ig-gray3)" }}>Ticket for</p>}
              {info && <p className="text-lg font-bold tracking-widest uppercase" style={{ color: "var(--ig-gold)" }}>{info.name}</p>}
              <div className="mt-auto pt-6">
                <p className="text-xs" style={{ color: "var(--ig-navy)" }}>Show this QR code at the entrance</p>
              </div>
            </div>
            {/* Right: QR */}
            <div className="flex flex-col items-center justify-center px-8 py-8" style={{ minWidth: 240 }}>
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
              ) : (
                <div className="w-48 h-48 rounded-xl animate-pulse" style={{ background: "var(--ig-light)" }} />
              )}
            </div>
          </div>

          {/* ── MOBILE: portrait ── */}
          <div className="sm:hidden">
            <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
              <img src="/logo.png" alt="Impact Gstaad" className="h-7 object-contain mb-4" />
              {info ? (
                <>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--ig-navy)" }}>{info.event.name}</h2>
                  {eventDate && <p className="text-xs mt-1" style={{ color: "var(--ig-navy)" }}>{eventDate}</p>}
                  <p className="text-xs" style={{ color: "var(--ig-navy)" }}>{info.event.location}</p>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-5 w-48 rounded animate-pulse" style={{ background: "var(--ig-gray2)" }} />
                  <div className="h-3 w-32 rounded animate-pulse" style={{ background: "var(--ig-gray2)" }} />
                </div>
              )}
            </div>
            <div className="h-0.5 w-full" style={{ background: "var(--ig-gold)" }} />
            <div className="px-6 py-6">
              {info && <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--ig-gray3)" }}>Ticket for</p>}
              {info && <p className="text-base font-bold tracking-widest uppercase mb-4" style={{ color: "var(--ig-gold)" }}>{info.name}</p>}
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-full rounded-xl" />
              ) : (
                <div className="w-full aspect-square rounded-xl animate-pulse" style={{ background: "var(--ig-light)" }} />
              )}
            </div>
            <div className="px-6 pb-5 pt-1 border-t" style={{ borderColor: "var(--ig-gray2)" }}>
              <p className="text-xs text-center" style={{ color: "var(--ig-navy)" }}>Show this QR code at the entrance</p>
            </div>
          </div>
        </div>

        {/* PDF button */}
        <a
          href={`/api/ticket/${token}/pdf`}
          download
          className="mt-5 w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition border"
          style={{ background: "white", color: "var(--ig-navy)", borderColor: "var(--ig-gray2)", textDecoration: "none" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Save as PDF
        </a>
      </div>
    </main>
  );
}
