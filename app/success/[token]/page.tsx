"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

export default function SuccessPage() {
  const { token } = useParams<{ token: string }>();
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (token) {
      const ticketUrl = `${window.location.origin}/ticket/${token}`;
      QRCode.toDataURL(ticketUrl, { width: 300, margin: 2, color: { dark: "#1E3263", light: "#FFFFFF" } }).then(setQrUrl);
    }
  }, [token]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <img src="/logo.png" alt="Impact Gstaad" className="h-10 mx-auto mb-8 object-contain" />

        {/* Success indicator */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--ig-navy)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ig-gold)" }}>
            Registration confirmed
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ig-navy)" }}>You're on the list.</h1>
          <p className="text-sm mt-2" style={{ color: "var(--ig-gray3)" }}>
            Your QR code has been sent by email.
          </p>
        </div>

        {/* Ticket card */}
        <div className="rounded-2xl border overflow-hidden shadow-sm mb-6" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, var(--ig-navy), var(--ig-gold))` }} />
          <div className="p-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "var(--ig-gray3)" }}>
              Your Ticket
            </p>
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-52 h-52 mx-auto rounded-xl" />
            ) : (
              <div className="w-52 h-52 mx-auto rounded-xl animate-pulse" style={{ background: "var(--ig-gray2)" }} />
            )}
            <p className="text-xs mt-4 font-mono break-all" style={{ color: "var(--ig-gray3)" }}>{token}</p>
          </div>
        </div>

        <p className="text-xs tracking-wide mb-5" style={{ color: "var(--ig-gray3)" }}>
          Screenshot or email — show this QR code at the entrance.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={`/ticket/${token}`}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white tracking-widest uppercase text-center block transition"
            style={{ background: "var(--ig-navy)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-gold)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-navy)"}
          >
            View Full Ticket
          </a>
          <a
            href={`/ticket/${token}`}
            className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase text-center block border transition"
            style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", background: "white" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; }}
          >
            Save as PDF
          </a>
        </div>
      </div>
    </main>
  );
}
