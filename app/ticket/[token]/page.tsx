"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { T, getLang } from "@/lib/i18n";

type TicketInfo = {
  name: string;
  event: { name: string; date: string; location: string };
};

function TicketContent() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const lang = getLang(searchParams);
  const t = T[lang];
  const [qrUrl, setQrUrl] = useState("");
  const [info, setInfo] = useState<TicketInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notFound">("loading");
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState("");

  useEffect(() => {
    if (!token) return;
    const ticketUrl = `${window.location.origin}/ticket/${token}`;
    QRCode.toDataURL(ticketUrl, { width: 340, margin: 2, color: { dark: "#1E3263", light: "#FFFFFF" } }).then(setQrUrl);
    fetch(`/api/ticket/${token}?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setStatus("notFound"); return; }
        setInfo(d);
        setStatus("ready");
      })
      .catch(() => setStatus("notFound"));
  }, [token, lang]);

  useEffect(() => {
    document.title = info?.event?.name ? `Ticket: ${info.event.name} – Impact Gstaad` : "Ticket – Impact Gstaad";
  }, [info?.event?.name]);

  const eventDate = info?.event?.date
    ? new Date(info.event.date).toLocaleDateString(t.dateLocale, {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  // wa.me needs plain digits, full country code, no leading + or 0. Numbers typed in
  // local Swiss format (e.g. "079 123 45 67") get the 41 country code filled in — this
  // audience is overwhelmingly Swiss; anyone dialing internationally already types a +.
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

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .ticket-card { box-shadow: none !important; border: 1px solid #D0DDEA !important; }
          header, footer, nav { display: none !important; }
        }
      `}</style>

      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 no-print-bg"
        style={{ background: "var(--ig-light)" }}
      >
        {status === "notFound" ? (
          <div className="w-full max-w-xs sm:max-w-md text-center">
            <div
              className="rounded-2xl border p-8 shadow-sm"
              style={{ background: "white", borderColor: "var(--ig-gray2)" }}
            >
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
        ) : (
        <div className="w-full max-w-xs sm:max-w-2xl">

          {/* Ticket card */}
          <div
            className="ticket-card rounded-3xl overflow-hidden shadow-xl border"
            style={{ background: "white", borderColor: "var(--ig-gray2)" }}
          >
            {/* ── DESKTOP: side by side ── */}
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

                {/* Gold divider */}
                <div className="my-6 h-px" style={{ background: "var(--ig-gold)" }} />

                {info && (
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--ig-gray3)" }}>
                    {t.ticketFor}
                  </p>
                )}
                {info && (
                  <p className="text-lg font-bold" style={{ color: "var(--ig-navy)" }}>{info.name}</p>
                )}

                <div className="mt-auto pt-6">
                  <p className="text-xs" style={{ color: "var(--ig-navy)" }}>{t.showQr}</p>
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

            {/* ── MOBILE: portrait stacked ── */}
            <div className="sm:hidden">
              {/* Header */}
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

              {/* Gold divider */}
              <div className="h-0.5 w-full" style={{ background: "var(--ig-gold)" }} />

              {/* QR section */}
              <div className="px-6 py-6">
                {info && (
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--ig-gray3)" }}>
                    {t.ticketFor}
                  </p>
                )}
                {info && (
                  <p className="text-base font-bold mb-4" style={{ color: "var(--ig-navy)" }}>{info.name}</p>
                )}
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code" className="w-full rounded-xl" />
                ) : (
                  <div className="w-full aspect-square rounded-xl animate-pulse" style={{ background: "var(--ig-light)" }} />
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 pt-1 border-t" style={{ borderColor: "var(--ig-gray2)" }}>
                <p className="text-xs text-center" style={{ color: "var(--ig-navy)" }}>
                  {t.showQr}
                </p>
              </div>
            </div>
          </div>

          {/* Save as PDF button */}
          <a
            href={`/api/ticket/${token}/pdf?lang=${lang}`}
            download
            className="no-print mt-5 w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
            style={{ background: "var(--ig-gold)", color: "white", border: "1px solid var(--ig-gold)", textDecoration: "none" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#B8791F"; (e.currentTarget as HTMLElement).style.borderColor = "#B8791F"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-gold)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gold)"; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {t.savePdf}
          </a>

          {/* Send via WhatsApp */}
          {!showWhatsApp ? (
            <button
              onClick={() => setShowWhatsApp(true)}
              className="no-print mt-3 w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
              style={{ background: "transparent", color: "var(--ig-navy)", border: "1.5px solid var(--ig-navy)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(30,50,99,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-1.742-.87-2.883-1.553-4.03-3.522-.305-.526.305-.489.87-1.628.098-.198.049-.371-.05-.52-.099-.148-.669-1.61-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.05 3.133 4.999 4.27 2.949 1.14 2.949.76 3.42.712.47-.05 1.758-.719 2.006-1.412.248-.694.248-1.29.173-1.412-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.003L2 22l5.184-1.312A9.94 9.94 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.062a8.05 8.05 0 01-4.108-1.13l-.294-.175-3.06.775.82-2.978-.19-.306A8.06 8.06 0 013.938 12c0-4.452 3.61-8.062 8.062-8.062S20.062 7.548 20.062 12 16.452 20.062 12 20.062z"/></svg>
              {lang === "de" ? "Per WhatsApp senden" : lang === "fr" ? "Envoyer par WhatsApp" : "Send via WhatsApp"}
            </button>
          ) : (
            <div className="no-print mt-3 flex gap-2">
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
        </div>
        )}
      </main>
    </>
  );
}

export default function TicketPage() {
  return (
    <Suspense>
      <TicketContent />
    </Suspense>
  );
}
