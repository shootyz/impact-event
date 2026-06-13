"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

export default function TicketPage() {
  const { token } = useParams<{ token: string }>();
  const [qrUrl, setQrUrl] = useState("");
  const [walletEnabled, setWalletEnabled] = useState(false);

  useEffect(() => {
    if (token) {
      const ticketUrl = `${window.location.origin}/ticket/${token}`;
      QRCode.toDataURL(ticketUrl, { width: 280, margin: 2 }).then(setQrUrl);
      fetch(`/api/wallet/${token}`, { method: "HEAD" }).then((r) => {
        setWalletEnabled(r.status !== 503);
      }).catch(() => {});
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

        <p className="text-xs text-gray-500 mt-6 mb-4">
          Show this QR code at the entrance.
        </p>

        {walletEnabled && (
          <a
            href={`/api/wallet/${token}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
            </svg>
            Add to Apple Wallet
          </a>
        )}
      </div>
    </main>
  );
}
