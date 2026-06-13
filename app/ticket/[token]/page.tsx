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
      QRCode.toDataURL(ticketUrl, { width: 280, margin: 2 }).then(setQrUrl);
    }
  }, [token]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-900">
      <div className="w-full max-w-xs text-center">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-8">
          Impact Gstaad · Ticket
        </p>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR-Code"
              className="w-full rounded-xl"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl animate-pulse" />
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-mono break-all">{token}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Zeige diesen QR-Code am Eingang vor.
        </p>
      </div>
    </main>
  );
}
