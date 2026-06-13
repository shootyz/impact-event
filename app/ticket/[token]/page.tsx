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
    QRCode.toDataURL(ticketUrl, { width: 320, margin: 2 }).then(setQrUrl);
    fetch(`/api/ticket/${token}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setInfo(d); });
  }, [token]);

  const eventDate = info?.event?.date
    ? new Date(info.event.date).toLocaleDateString("de-CH", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
        }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-900 print:bg-white">
        <div className="print-wrapper w-full flex flex-col items-center">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-8 no-print">
            Impact Gstaad · Ticket
          </p>

          {/* Ticket card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs print:shadow-none print:rounded-xl print:border print:border-gray-200">
            {/* Event info — shown in print */}
            <div className="hidden print:block mb-5 pb-4 border-b border-gray-100 text-center">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
                Impact Gstaad · Ticket
              </p>
              {info && (
                <>
                  <p className="text-base font-bold text-gray-900">{info.event.name}</p>
                  {eventDate && <p className="text-xs text-gray-500 mt-1">{eventDate}</p>}
                  <p className="text-xs text-gray-500">{info.event.location}</p>
                  <p className="text-sm font-medium text-gray-700 mt-2">{info.name}</p>
                </>
              )}
            </div>

            {/* Event info — shown on screen */}
            {info && (
              <div className="print:hidden mb-4 pb-4 border-b border-gray-100 text-center">
                <p className="text-sm font-bold text-gray-900">{info.event.name}</p>
                {eventDate && <p className="text-xs text-gray-400 mt-0.5">{eventDate}</p>}
                <p className="text-xs text-gray-400">{info.event.location}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">{info.name}</p>
              </div>
            )}

            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-full rounded-xl" />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-xl animate-pulse" />
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-300 font-mono break-all text-center">{token}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-6 mb-5 no-print">
            Show this QR code at the entrance.
          </p>

          <button
            onClick={() => window.print()}
            className="no-print inline-flex items-center justify-center gap-2 w-full max-w-xs py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition"
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
