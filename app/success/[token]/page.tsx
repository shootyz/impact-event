"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { T, getLang } from "@/lib/i18n";

type TicketInfo = {
  name: string;
  email: string;
  event: { name: string; date: string; location: string };
};

function SuccessPageInner() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const already = searchParams.get("already") === "1";
  const lang = getLang(searchParams);
  const t = T[lang];
  const [info, setInfo] = useState<TicketInfo | null>(null);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "notFound">("loading");
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState("");

  const resendEmail = async () => {
    setResending(true);
    await fetch(`/api/resend-ticket/${token}`, { method: "POST" });
    setResending(false);
    setResendDone(true);
  };

  // wa.me needs plain digits, full country code, no leading + or 0 — see ticket page.
  function sendViaWhatsApp() {
    let digits = whatsAppNumber.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    else if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = "41" + digits.slice(1);
    if (!digits) return;
    const ticketUrl = `${window.location.origin}/ticket/${token}?lang=${lang}`;
    const eventName = info?.event?.name ?? "";
    const message = lang === "de"
      ? `Mein Ticket für ${eventName}: ${ticketUrl}`
      : lang === "fr"
      ? `Mon billet pour ${eventName} : ${ticketUrl}`
      : `My ticket for ${eventName}: ${ticketUrl}`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank");
  }

  useEffect(() => {
    if (!token) return;
    fetch(`/api/ticket/${token}?lang=${lang}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus("notFound"); return; }
        setInfo(d);
        setStatus("ready");
      })
      .catch(() => setStatus("notFound"));
  }, [token, lang]);

  useEffect(() => {
    document.title = "Anmeldung bestätigt – Impact Gstaad";
  }, []);

  if (status === "notFound") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "var(--ig-light)" }}>
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border p-8 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
            <img src="/logo.png" alt="Impact Gstaad" className="h-8 object-contain mx-auto mb-6" />
            <h1 className="text-lg font-bold mb-2" style={{ color: "var(--ig-navy)" }}>{t.ticketNotFound}</h1>
            <p className="text-sm mb-6" style={{ color: "var(--ig-gray3)" }}>{t.ticketNotFoundHint}</p>
            <Link
              href="/"
              className="inline-block py-3 px-6 rounded-xl font-semibold text-sm tracking-widest uppercase"
              style={{ background: "var(--ig-navy)", color: "white", textDecoration: "none" }}
            >
              {t.backToHome}
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            {lang === "de" ? "Du bist bereits für dieses Event angemeldet." : lang === "fr" ? "Vous êtes déjà inscrit(e) à cet événement." : "You are already registered for this event."}
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
            {already
              ? (lang === "de" ? "Anmeldung vorhanden" : lang === "fr" ? "Inscription enregistrée" : "Registration on file")
              : t.registrationConfirmed}
          </p>

          <h1 className="text-xl font-bold mb-6" style={{ color: "var(--ig-navy)" }}>
            {info?.event?.name ?? ""}
          </h1>

          <div className="rounded-xl px-5 py-4 mb-6 text-left" style={{ background: "var(--ig-light)", border: "1px solid var(--ig-gray2)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--ig-navy)" }}>
              {t.ticketSentTo}
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--ig-navy)" }}>
              {info?.email ?? "…"}
            </p>
          </div>

          <p className="text-xs mb-1" style={{ color: "var(--ig-gray3)" }}>{t.checkSpam}</p>
          <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>
            {t.questions} <a href="mailto:info@impactgstaad.ch" style={{ color: "var(--ig-navy)", textDecoration: "underline" }}>info@impactgstaad.ch</a>
          </p>
        </div>

        {/* PDF + WhatsApp buttons */}
        <div className="mt-5 flex gap-2">
          <a
            href={`/api/ticket/${token}/pdf?lang=${lang}`}
            download
            className="flex-1 py-3.5 rounded-xl font-semibold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
            style={{ background: "var(--ig-gold)", color: "white", textDecoration: "none" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#B8791F"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-gold)"; }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {t.saveTicketPdf}
          </a>
          <button
            onClick={() => setShowWhatsApp(v => !v)}
            className="flex-1 py-3.5 rounded-xl font-semibold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
            style={{ background: "transparent", color: "var(--ig-navy)", border: "1.5px solid var(--ig-navy)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(30,50,99,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-1.742-.87-2.883-1.553-4.03-3.522-.305-.526.305-.489.87-1.628.098-.198.049-.371-.05-.52-.099-.148-.669-1.61-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.05 3.133 4.999 4.27 2.949 1.14 2.949.76 3.42.712.47-.05 1.758-.719 2.006-1.412.248-.694.248-1.29.173-1.412-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.003L2 22l5.184-1.312A9.94 9.94 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.062a8.05 8.05 0 01-4.108-1.13l-.294-.175-3.06.775.82-2.978-.19-.306A8.06 8.06 0 013.938 12c0-4.452 3.61-8.062 8.062-8.062S20.062 7.548 20.062 12 16.452 20.062 12 20.062z"/></svg>
            {lang === "de" ? "Per WhatsApp senden" : lang === "fr" ? "Envoyer par WhatsApp" : "Send via WhatsApp"}
          </button>
        </div>

        {showWhatsApp && (
          <div className="mt-3 flex gap-2">
            <input
              type="tel"
              value={whatsAppNumber}
              onChange={e => setWhatsAppNumber(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendViaWhatsApp(); }}
              placeholder={lang === "de" ? "Deine Nummer, z.B. 079 123 45 67" : lang === "fr" ? "Ton numéro, p.ex. 079 123 45 67" : "Your number, e.g. +41 79 123 45 67"}
              autoFocus
              className="flex-1 py-3 px-4 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-navy)", background: "white" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
            />
            <button
              onClick={sendViaWhatsApp}
              disabled={!whatsAppNumber.trim()}
              className="py-3 px-5 rounded-xl font-semibold text-sm uppercase transition disabled:opacity-40"
              style={{ background: "var(--ig-navy)", color: "white" }}
            >
              {lang === "de" ? "Senden" : lang === "fr" ? "Envoyer" : "Send"}
            </button>
          </div>
        )}

        {/* Resend email button — only for already-registered users */}
        {already && (
          <button
            onClick={resendEmail}
            disabled={resending || resendDone}
            className="mt-3 w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition disabled:opacity-50"
            style={{ background: "transparent", color: "var(--ig-navy)", border: "1.5px solid var(--ig-navy)", cursor: resendDone ? "default" : "pointer" }}
            onMouseEnter={e => { if (!resendDone) (e.currentTarget as HTMLElement).style.background = "rgba(30,50,99,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {resendDone
              ? (lang === "de" ? "Ticket gesendet – prüfe dein Postfach" : lang === "fr" ? "Billet envoyé – vérifiez votre boîte" : "Ticket sent — check your inbox")
              : resending
              ? (lang === "de" ? "Senden…" : lang === "fr" ? "Envoi…" : "Sending…")
              : (lang === "de" ? "Ticket per E-Mail senden" : lang === "fr" ? "Envoyer mon billet" : "Email my ticket")}
          </button>
        )}

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
