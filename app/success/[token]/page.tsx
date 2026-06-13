"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

export default function SuccessPage() {
  const { token } = useParams<{ token: string }>();
  const [qrUrl, setQrUrl] = useState("");
  const [walletEnabled, setWalletEnabled] = useState(false);

  useEffect(() => {
    if (token) {
      const ticketUrl = `${window.location.origin}/ticket/${token}`;
      QRCode.toDataURL(ticketUrl, { width: 280, margin: 2 }).then(setQrUrl);
    }
    // Check if wallet is available by pinging the endpoint
    fetch(`/api/wallet/${token || "check"}`, { method: "HEAD" }).then((r) => {
      setWalletEnabled(r.status !== 503);
    }).catch(() => {});
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
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-56 h-56 mx-auto rounded-xl"
            />
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
            className="inline-block w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition text-center"
          >
            View full-screen ticket
          </a>
          {walletEnabled && (
            <a
              href={`/api/wallet/${token}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
              </svg>
              Add to Apple Wallet
            </a>
          )}
        </div>

        <a
          href="/"
          className="inline-block mt-6 text-sm text-gray-500 underline underline-offset-2"
        >
          ← Back to home
        </a>
      </div>
    </main>
  );
}
