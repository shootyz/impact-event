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
          <h1 className="text-2xl font-bold text-gray-900">Anmeldung bestätigt!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Dein QR-Code wurde per E-Mail verschickt.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
            Dein Ticket
          </p>
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR-Code"
              className="w-56 h-56 mx-auto rounded-xl"
            />
          ) : (
            <div className="w-56 h-56 mx-auto bg-gray-100 rounded-xl animate-pulse" />
          )}
          <p className="text-xs text-gray-300 mt-4 font-mono break-all">{token}</p>
        </div>

        <p className="text-xs text-gray-400">
          Screenshot oder E-Mail — zeige diesen QR-Code am Eingang.
        </p>

        <a
          href="/"
          className="inline-block mt-6 text-sm text-gray-500 underline underline-offset-2"
        >
          ← Zurück zur Startseite
        </a>
      </div>
    </main>
  );
}
