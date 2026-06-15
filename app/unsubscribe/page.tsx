"use client";

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "var(--ig-light)" }}>
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="Impact Gstaad" className="h-9 mx-auto mb-8 object-contain" />
        <div className="rounded-2xl border p-8 shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--ig-navy)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-3" style={{ color: "var(--ig-navy)" }}>Unsubscribed</h1>
          <p className="text-sm" style={{ color: "var(--ig-navy)" }}>
            You have been removed from our mailing list. You will no longer receive event invitations.
          </p>
          <p className="text-xs mt-4" style={{ color: "var(--ig-gray3)" }}>
            Questions? <a href="mailto:info@impactgstaad.ch" style={{ color: "var(--ig-navy)", textDecoration: "underline" }}>info@impactgstaad.ch</a>
          </p>
        </div>
      </div>
    </main>
  );
}
