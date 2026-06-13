"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

export default function TicketPage() {
  const { token } = useParams<{ token: string }>();
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (token) {
      const ticketUrl = `${window.location.origin}/ticket/${token}`;
      QRCode.toDataURL(ticketUrl, { width: 320, margin: 2 }).then(setQrUrl);
    }
  }, [token]);

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-900 print:bg-white">
        <div className="w-full max-w-xs text-center">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-8 no-print">
            Impact Gstaad · Ticket
          </p>

          <div className="print-card bg-white rounded-3xl p-6 shadow-2xl">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4 hidden print:block">
              Impact Gstaad · Ticket
            </p>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-full rounded-xl"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-xl animate-pulse" />
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-mono break-all">{token}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-6 mb-5 no-print">
            Show this QR code at the entrance.
          </p>

          <button
            onClick={() => window.print()}
            className="no-print inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Save as PDF
          </button>
        </div>
      </main>
    </>
  );
}
