"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

type TicketInfo = {
  name: string;
  email: string;
  event: { name: string; date: string; location: string };
};

function SuccessPageInner() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const already = searchParams.get("already") === "1";
  const [info, setInfo] = useState<TicketInfo | null>(null);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const resendEmail = async () => {
    setResending(true);
    await fetch(`/api/resend-ticket/${token}`, { method: "POST" });
    setResending(false);
    setResendDone(true);
  };

  useEffect(() => {
    if (!token) return;
    fetch(`/api/ticket/${token}`).then(r => r.json()).then(d => { if (!d.error) setInfo(d); });
  }, [token]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Impact Gstaad" className="h-10 mx-auto mb-8 object-contain" />
          <div className="h-px mb-8" style={{ background: "var(--ig-gray2)" }} />
        </div>

        {/* Already registered banner */}
        {already && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm text-center font-medium" style={{ background: "#fdf8f0", border: "1px solid #D28D28", color: "#D28D28" }}>
            You are already registered for this event.
          </div>
        )}

        {/* Confirmation card */}
        <div className="rounded-2xl border p-8 shadow-sm text-center" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>

          {/* Checkmark */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--ig-navy)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ig-gold)" }}>
            {already ? "Registration on file" : "Registration Confirmed"}
          </p>

          <h1 className="text-xl font-bold mb-6" style={{ color: "var(--ig-navy)" }}>
            {info?.event?.name ?? ""}
          </h1>

          <div className="rounded-xl px-5 py-4 mb-6 text-left" style={{ background: "var(--ig-light)", border: "1px solid var(--ig-gray2)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--ig-navy)" }}>
              Your ticket has been sent to:
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--ig-navy)" }}>
              {info?.email ?? "…"}
            </p>
          </div>

          {resendDone ? (
            <p className="text-xs font-medium" style={{ color: "#16a34a" }}>Ticket sent — check your inbox.</p>
          ) : (
            <button onClick={resendEmail} disabled={resending}
              className="text-xs underline transition disabled:opacity-40"
              style={{ color: "var(--ig-navy)", background: "none", border: "none", cursor: "pointer" }}>
              {resending ? "Sending…" : "Resend ticket email"}
            </button>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--ig-gray3)" }}>
            Questions? <a href="mailto:info@impactgstaad.ch" style={{ color: "var(--ig-navy)", textDecoration: "underline" }}>info@impactgstaad.ch</a>
          </p>
        </div>

        {/* PDF button */}
        <a
          href={`/api/ticket/${token}/pdf`}
          download
          className="mt-5 w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
          style={{ background: "var(--ig-gold)", color: "white", textDecoration: "none" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#B8791F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-gold)"; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Save Ticket as PDF
        </a>

      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessPageInner />
    </Suspense>
  );
}
