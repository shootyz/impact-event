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
      QRCode.toDataURL(ticketUrl, { width: 280, margin: 2 }).then(setQrUrl);
    }
  }, [token]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Impact Gstaad
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Registration confirmed!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Your QR code has been sent by email.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
            Your ticket
          </p>
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-xl" />
          ) : (
            <div className="w-56 h-56 mx-auto bg-gray-100 rounded-xl animate-pulse" />
          )}
          <p className="text-xs text-gray-300 mt-4 font-mono break-all">{token}</p>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Screenshot or email — show this QR code at the entrance.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href={`/ticket/${token}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition"
          >
            View full-screen ticket
          </a>
          <a
            href={`/ticket/${token}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Save as PDF
          </a>
        </div>

        <a href="/" className="inline-block mt-6 text-sm text-gray-500 underline underline-offset-2">
          ← Back to home
        </a>
      </div>
    </main>
  );
}
