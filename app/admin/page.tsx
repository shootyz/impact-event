"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type jsQRType from "jsqr";
import CampaignBuilder from "./CampaignBuilder";
import PreviewPanel from "./PreviewPanel";
import ZielgruppenDashboard from "./ZielgruppenDashboard";
import AnalyticsDashboard from "./AnalyticsDashboard";
import type { CampaignBlock } from "./campaign-renderer";
import type { Lang } from "./i18n";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IconProps = { className?: string; style?: React.CSSProperties };
const IconCheck = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconX = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconMail = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconTrash = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconRefresh = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const IconDownload = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconUpload = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const IconCamera = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconPlus = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconChevron = ({ down = true, className = "w-4 h-4", style }: IconProps & { down?: boolean }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={down ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
  </svg>
);
const IconEye = ({ open = true, className = "w-5 h-5", style }: IconProps & { open?: boolean }) => open ? (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);
const IconLock = ({ className = "w-4 h-4", style }: IconProps) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// ─── Shared input style helper ─────────────────────────────────────────────────
const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none bg-[#F8F9FF]";
const inputStyle = { border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)" };

// ─── Btn helpers ───────────────────────────────────────────────────────────────
function BtnPrimary({ children, onClick, disabled, type = "button", className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`px-4 py-1.5 rounded-lg font-semibold text-xs tracking-wide transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 ${className}`}
      style={{ background: hover && !disabled ? "#B8791F" : "var(--ig-gold)", color: "#fff" }}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick, disabled, className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`py-2 rounded-lg font-medium text-xs tracking-wide transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 ${className}`}
      style={{
        border: `1.5px solid ${hover ? "var(--ig-navy)" : "var(--ig-gray2)"}`,
        color: hover ? "var(--ig-navy)" : "var(--ig-black)",
        background: hover ? "var(--ig-light)" : "white",
      }}
    >
      {children}
    </button>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, danger, onConfirm, onCancel }: {
  title: string; message: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(30,50,99,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl" style={{ background: "white" }}>
        <div className="h-0.5" style={{ background: danger ? "#dc2626" : "var(--ig-gold)" }} />
        <div className="px-6 pt-6 pb-5">
          <p className="font-bold text-base mb-2" style={{ color: "var(--ig-navy)" }}>{title}</p>
          <p className="text-sm" style={{ color: "var(--ig-gray3)" }}>{message}</p>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)", background: "white" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"}
          >Abbrechen</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: danger ? "#dc2626" : "var(--ig-navy)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >{danger ? "Löschen" : "Bestätigen"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Registration = {
  id: string; name: string; email: string; qr_token: string;
  checked_in: boolean; checked_in_at: string | null; created_at: string;
};
type Event = { id: string; name: string; date: string; location: string; };
type EventCard = { id: string; name: string; date: string; location: string; description: string | null; active: boolean; total: number; checked_in: number; registration_password: string | null; slug: string | null; category: string | null; created_at: string; registration_type: "invite" | "form"; max_capacity: number | null; form_config?: FormConfig | null; };
type FormRegistration = { id: string; first_name: string; last_name: string; email: string; company: string | null; message: string | null; extra_fields?: Record<string, string> | null; status: "pending" | "confirmed" | "rejected" | "waitlisted"; created_at: string; };
type FormField = { id: string; type: "text" | "textarea"; label: string; required: boolean; visible: boolean };
type FormConfig = { intro: string; fields: FormField[] };
const BUILTIN_FIELD_IDS = ["company", "message"];
const DEFAULT_FORM_CONFIG: FormConfig = {
  intro: "",
  fields: [
    { id: "company", type: "text", label: "Firma / Organisation", required: false, visible: true },
    { id: "message", type: "textarea", label: "Nachricht", required: false, visible: true },
  ],
};

const EVENT_CATEGORIES = ["Impact Circle Event", "Impact Workshop", "Impact Experience", "Young Impact Day"] as const;
type ScanResult = { status: "success" | "already_checked_in" | "error"; name?: string; message?: string; };
type ImportResult = { imported: number; duplicates: string[]; errors: string[]; } | null;

// ─── Campaign card (needs own state, can't use hooks inside .map) ──────────────
type CampaignType = { id: string; subject: string; body_html: string; blocks_json?: { title?: string } | unknown; header_image_url: string | null; event_url: string | null; sent_at: string | null; scheduled_at: string | null; recipient_count: number | null; created_at: string; zielgruppe_id?: string | null; event_id?: string | null; };
const TEST_EMAILS = [
  "nik.thomi@impactgstaad.ch",
  "andreas.wandfluh@impactgstaad.ch",
  "michel.hediger@impactgstaad.ch",
  "chantal.reichenbach@impactgstaad.ch",
];

function CampaignCard({ c, onSend, onDelete, onSchedule, onEdit, onDuplicate, zielgruppeName }: {
  c: CampaignType;
  onSend: (id: string, sent: number) => void;
  onDelete: (id: string) => void;
  onSchedule?: (id: string, scheduled_at: string | null) => void;
  onEdit?: () => void;
  onDuplicate?: () => Promise<void>;
  zielgruppeName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testSelected, setTestSelected] = useState<string[]>([]);
  const [testCustom, setTestCustom] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const testBtnRef = useRef<HTMLButtonElement>(null);
  const [testPanelPos, setTestPanelPos] = useState({ top: 0, right: 0 });
  const [showRecipients, setShowRecipients] = useState(false);
  const [recipients, setRecipients] = useState<{ email: string; first_name: string; last_name: string }[] | null>(null);
  const recipientsBtnRef = useRef<HTMLButtonElement>(null);
  const [recipientsPos, setRecipientsPos] = useState({ top: 0, left: 0 });

  const sentDateText = c.sent_at
    ? `Gesendet am ${new Date(c.sent_at).toLocaleString("de-CH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : null;
  const statusText = c.sent_at
    ? sentDateText!
    : c.scheduled_at
    ? `Geplant für ${new Date(c.scheduled_at).toLocaleString("de-CH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : new Date(c.created_at).toLocaleString("de-CH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--ig-navy)" }}>{(c.blocks_json as { title?: string } | null)?.title || c.subject}</p>
              {(() => {
                const bj = c.blocks_json as { lang?: string } | null;
                const lang = bj && !Array.isArray(bj) ? bj.lang : null;
                if (!lang) return null;
                return <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1px solid var(--ig-gray2)", flexShrink: 0 }}>{lang.toUpperCase()}</span>;
              })()}
              {zielgruppeName && !c.sent_at && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(210,141,40,0.1)", color: "var(--ig-gold)", border: "1px solid rgba(210,141,40,0.2)", flexShrink: 0 }}>{zielgruppeName}</span>}
            </div>
            <p className="text-xs" style={{ color: c.scheduled_at && !c.sent_at ? "var(--ig-gold)" : "var(--ig-gray3)" }}>
              {statusText}
              {!c.sent_at && !zielgruppeName && <span style={{ color: "var(--ig-gray3)" }}> · <span style={{ fontStyle: "italic" }}>Keine Zielgruppe</span></span>}
              {c.sent_at && c.recipient_count != null && (
                <> · <button ref={recipientsBtnRef}
                  className="underline"
                  style={{ color: "var(--ig-navy)", cursor: "pointer", background: "none", border: "none", padding: 0, font: "inherit" }}
                  onClick={async () => {
                    if (showRecipients) { setShowRecipients(false); return; }
                    const btn = recipientsBtnRef.current;
                    if (btn) {
                      const r = btn.getBoundingClientRect();
                      setRecipientsPos({ top: r.bottom + 6, left: r.left });
                    }
                    setShowRecipients(true);
                    if (!recipients) {
                      const res = await fetch(`/api/campaigns/${c.id}/recipients`);
                      const d = await res.json();
                      setRecipients(Array.isArray(d) ? d : []);
                    }
                  }}>
                  {c.recipient_count} Empfänger
                </button></>
              )}
            </p>
            {/* Recipients popup */}
            {showRecipients && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRecipients(false)} />
                <div className="fixed z-20 rounded-xl border shadow-lg" style={{ top: recipientsPos.top, left: recipientsPos.left, background: "white", borderColor: "var(--ig-gray2)", minWidth: 280, maxWidth: 360, maxHeight: 400, display: "flex", flexDirection: "column" }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--ig-navy)" }}>{recipients ? `${recipients.length} Empfänger` : "Lädt…"}</p>
                    {recipients && recipients.length > 0 && (
                      <button className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}
                        onClick={() => {
                          const csv = ["Vorname,Nachname,E-Mail", ...recipients.map(r => `${r.first_name},${r.last_name},${r.email}`)].join("\n");
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                          a.download = `empfaenger-${c.subject.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.csv`;
                          a.click();
                        }}>
                        CSV ↓
                      </button>
                    )}
                  </div>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {!recipients ? (
                      <p className="p-4 text-xs" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</p>
                    ) : recipients.length === 0 ? (
                      <p className="p-4 text-xs" style={{ color: "var(--ig-gray3)" }}>Keine Empfänger gespeichert.</p>
                    ) : recipients.map(r => (
                      <div key={r.email} className="px-4 py-2 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
                        <p className="text-xs font-medium" style={{ color: "var(--ig-navy)" }}>{r.first_name} {r.last_name}</p>
                        <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>{r.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={async () => {
                if (expanded) { setExpanded(false); return; }
                setExpanded(true);
                setPreviewLoading(true);
                const res = await fetch("/api/campaigns/preview", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject: c.subject, body_html: c.body_html, event_url: c.event_url || null, blocks_json: c.blocks_json || null }),
                });
                setPreviewHtml(await res.text());
                setPreviewLoading(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95 hover:opacity-70"
              style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
              {expanded ? "Schliessen" : "Vorschau"}
            </button>
            {!c.sent_at && !confirmSend && !scheduling && (
              <>
                {onEdit && (
                  <>
                    <button onClick={onEdit}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95 hover:opacity-70"
                      style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
                      Bearbeiten
                    </button>
                    {/* Testmail button with popup */}
                    <div className="relative">
                      <button ref={testBtnRef} onClick={() => {
                        if (testBtnRef.current) {
                          const r = testBtnRef.current.getBoundingClientRect();
                          setTestPanelPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                        }
                        setShowTestPanel(o => !o);
                      }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95 hover:opacity-70"
                        style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
                        Testmail
                      </button>
                      {showTestPanel && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowTestPanel(false)} />
                          <div className="fixed z-20 rounded-xl border shadow-lg p-4 space-y-3"
                            style={{ top: testPanelPos.top, right: testPanelPos.right, background: "white", borderColor: "var(--ig-gray2)", minWidth: 260 }}>
                            <p className="text-xs font-semibold" style={{ color: "var(--ig-navy)" }}>Empfänger wählen</p>
                            <div className="space-y-2">
                              {TEST_EMAILS.map(email => (
                                <label key={email} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#111" }}>
                                  <input type="checkbox" checked={testSelected.includes(email)}
                                    onChange={e => setTestSelected(prev => e.target.checked ? [...prev, email] : prev.filter(x => x !== email))}
                                    className="rounded" />
                                  {email}
                                </label>
                              ))}
                              <div className="flex gap-2 items-center">
                                <input type="checkbox" checked={!!testCustom && testSelected.includes(testCustom)}
                                  onChange={e => {
                                    if (e.target.checked && testCustom) setTestSelected(prev => [...prev.filter(x => x !== testCustom), testCustom]);
                                    else setTestSelected(prev => prev.filter(x => x !== testCustom));
                                  }} className="rounded shrink-0" />
                                <input className="flex-1 rounded-lg border px-2 py-1 text-xs outline-none"
                                  style={{ borderColor: "var(--ig-gray2)" }} placeholder="Weitere E-Mail-Adresse"
                                  value={testCustom}
                                  onChange={e => {
                                    const old = testCustom;
                                    setTestCustom(e.target.value);
                                    setTestSelected(prev => prev.filter(x => x !== old));
                                  }}
                                  onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = "var(--ig-navy)"}
                                  onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = "var(--ig-gray2)"} />
                              </div>
                            </div>
                            {testResult && (
                              <p className="text-xs" style={{ color: testResult.ok ? "#16a34a" : "#dc2626" }}>{testResult.msg}</p>
                            )}
                            <button
                              disabled={testSending || testSelected.length === 0}
                              className="w-full py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                              style={{ background: "var(--ig-navy)", color: "white" }}
                              onClick={async () => {
                                setTestSending(true); setTestResult(null);
                                const res = await fetch("/api/campaigns/test", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ campaign_id: c.id, subject: c.subject, body_html: c.body_html, event_url: c.event_url || null, recipients: testSelected }),
                                });
                                const d = await res.json();
                                setTestSending(false);
                                setTestResult(res.ok ? { ok: true, msg: `✓ An ${d.sent} gesendet` } : { ok: false, msg: d.error || "Fehler" });
                              }}>
                              {testSending ? "Wird gesendet…" : `Senden (${testSelected.length})`}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
                <button disabled={sending} onClick={() => setConfirmSend(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold transition active:scale-95 hover:opacity-70"
                  style={{ background: "var(--ig-gold)", color: "#fff", border: "none" }}>
                  Jetzt senden
                </button>
              </>
            )}
            {!c.sent_at && confirmSend && (
              <div className="flex flex-col items-end gap-1.5">
                {(() => {
                  const bj = c.blocks_json as { lang?: string } | null;
                  const lang = bj && !Array.isArray(bj) ? bj.lang?.toUpperCase() : null;
                  if (!lang) return null;
                  return <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>Wird nur an <strong style={{ color: "var(--ig-navy)" }}>{lang}</strong>-Mitglieder gesendet</p>;
                })()}
                <div className="flex gap-1.5">
                <button onClick={async () => {
                  setSending(true);
                  const res = await fetch(`/api/campaigns/${c.id}`, { method: "POST" });
                  const d = await res.json();
                  setSending(false);
                  if (res.ok) { setSendResult(`✓ An ${d.sent} Mitglieder gesendet`); onSend(c.id, d.sent); }
                  else { setSendResult(d.error || "Error"); setConfirmSend(false); }
                }} disabled={sending} className="text-xs px-3 py-1.5 rounded-lg font-bold transition active:scale-95 hover:opacity-70" style={{ background: "#dc2626", color: "#fff", border: "none" }}>
                  {sending ? "Wird gesendet…" : "Bestätigen"}
                </button>
                <button onClick={() => setConfirmSend(false)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95 hover:opacity-70"
                  style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
                  Abbrechen
                </button>
                </div>
              </div>
            )}
            {onDuplicate && (
              <button
                disabled={duplicating}
                onClick={async () => { setDuplicating(true); await onDuplicate(); setDuplicating(false); }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ background: duplicating ? "var(--ig-navy)" : "var(--ig-light)", color: duplicating ? "#fff" : "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
                {duplicating ? "Wird dupliziert…" : "Duplizieren"}
              </button>
            )}
            <button onClick={() => onDelete(c.id)} className="p-1.5 rounded-lg" style={{ color: "var(--ig-gray3)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Schedule picker */}
        {scheduling && (
          <div className="flex items-center gap-2 mt-2 mb-1">
            <input type="datetime-local" value={scheduleValue} onChange={e => setScheduleValue(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg flex-1"
              style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-navy)", background: "var(--ig-light)", outline: "none" }} />
            <button onClick={async () => {
              if (!scheduleValue) return;
              const res = await fetch(`/api/campaigns/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduled_at: new Date(scheduleValue).toISOString() }) });
              if (res.ok && onSchedule) { onSchedule(c.id, new Date(scheduleValue).toISOString()); setScheduling(false); }
            }} className="text-xs px-3 py-1.5 rounded-lg font-bold transition active:scale-95 hover:opacity-70" style={{ background: "var(--ig-navy)", color: "#fff", border: "none" }}>
              Speichern
            </button>
            {c.scheduled_at && (
              <button onClick={async () => {
                await fetch(`/api/campaigns/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduled_at: null }) });
                if (onSchedule) { onSchedule(c.id, null); setScheduling(false); }
              }} className="text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95 hover:opacity-70" style={{ background: "var(--ig-light)", color: "#dc2626", border: "1.5px solid #dc2626" }}>
                Entfernen
              </button>
            )}
            <button onClick={() => setScheduling(false)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95 hover:opacity-70"
              style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>
              Cancel
            </button>
          </div>
        )}
        {sendResult && <p className="text-xs mt-1 mb-2 font-medium" style={{ color: sendResult.startsWith("✓") ? "var(--ig-navy)" : "#dc2626" }}>{sendResult}</p>}
        {expanded && (() => {
          const bj = c.blocks_json;
          if (bj) {
            const parsed = typeof bj === "string" ? JSON.parse(bj) : bj;
            const blocks: CampaignBlock[] = (Array.isArray(parsed) ? parsed : parsed.blocks ?? []) as CampaignBlock[];
            const lang: Lang = (!Array.isArray(parsed) && parsed.lang) ? parsed.lang : "en";
            return (
              <div style={{ border: "1.5px solid var(--ig-gray2)", borderRadius: 12, padding: "24px", marginTop: 8 }}>
                <PreviewPanel blocks={blocks} subject={c.subject} lang={lang} onBlocks={() => {}} eventUrl={c.event_url ?? undefined} />
              </div>
            );
          }
          return (
            <div style={{ border: "1.5px solid var(--ig-gray2)", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
              {previewLoading
                ? <div className="p-8 text-center text-xs" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div>
                : <iframe srcDoc={previewHtml ?? ""} style={{ width: "100%", height: 600, border: "none", display: "block" }} title={c.subject} />
              }
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{ background: "white", borderColor: "var(--ig-gray2)" }}
    >
      {children}
    </div>
  );
}
function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
      <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--ig-navy)" }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [eventSection, setEventSection] = useState<null | "mailing" | "management">(null);
  const [showScannerPicker, setShowScannerPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "list" | "tools" | "analytics" | "form-regs">("list");

  const [dialog, setDialog] = useState<{ title: string; message: string; danger?: boolean; onConfirm: () => void } | null>(null);
  const showConfirm = (title: string, message: string, danger: boolean, onConfirm: () => void) =>
    setDialog({ title, message, danger, onConfirm });

  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState(false);
  const [manualVorname, setManualVorname] = useState("");
  const [manualNachname, setManualNachname] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualStatus, setManualStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [sendingQR, setSendingQR] = useState<string | null>(null);
  const [sendQRStatus, setSendQRStatus] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<ImportResult>(null);
  const [csvSending, setCsvSending] = useState(false);
  const [csvSendResult, setCsvSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [allEventCards, setAllEventCards] = useState<EventCard[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventPwInputs, setEventPwInputs] = useState<Record<string, string>>({});
  const [eventPwResults, setEventPwResults] = useState<Record<string, { ok: boolean; msg: string } | null>>({});
  const [eventPwLoading, setEventPwLoading] = useState<Record<string, boolean>>({});
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [regTypeInput, setRegTypeInput] = useState<"invite" | "form">("invite");
  const [maxCapInput, setMaxCapInput] = useState("");
  const [regTypeSaving, setRegTypeSaving] = useState(false);
  const [regTypeStatus, setRegTypeStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfig>(DEFAULT_FORM_CONFIG);
  const [formConfigSaving, setFormConfigSaving] = useState(false);
  const [formConfigStatus, setFormConfigStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  // Event list UI state
  const [eventsView, setEventsView] = useState<"grid" | "list">("grid");
  const [eventsSort, setEventsSort] = useState<"date-desc" | "date-asc" | "name-asc" | "created-desc">("date-desc");
  const [eventsCategory, setEventsCategory] = useState<string | null>(null);
  const [eventsStatusTab, setEventsStatusTab] = useState<"aktiv" | "archiv">("aktiv");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  // Event creation form
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventPw, setNewEventPw] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<string>("");
  const [newEventRegType, setNewEventRegType] = useState<"invite" | "form">("invite");
  const [newEventMaxCapacity, setNewEventMaxCapacity] = useState("");
  const [newEventLoading, setNewEventLoading] = useState(false);
  const [newEventResult, setNewEventResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [formRegs, setFormRegs] = useState<FormRegistration[]>([]);
  const [formRegsLoading, setFormRegsLoading] = useState(false);
  const [formRegsLoaded, setFormRegsLoaded] = useState(false);

  // Mailing state
  type Member = { id: string; first_name: string; last_name: string; email: string; unsubscribed: boolean; created_at: string; zielgruppe_id: string | null; anrede?: string | null; sprache?: string | null; invite_codes?: { code: string; used: boolean }[] | { code: string; used: boolean } | null; };
  type Zielgruppe = { id: string; name: string; created_at: string };
  type Campaign = { id: string; subject: string; body_html: string; blocks_json?: unknown; header_image_url: string | null; event_url: string | null; sent_at: string | null; scheduled_at: string | null; recipient_count: number | null; created_at: string; zielgruppe_id?: string | null; event_id?: string | null; };
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [builderZielgruppeId, setBuilderZielgruppeId] = useState<string | null>(null);
  const [mailingTab, setMailingTab] = useState<"members" | "compose" | "drafts" | "campaigns">("drafts");
  const [draftsLang, setDraftsLang] = useState<"all" | "en" | "de" | "fr">("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [zielgruppen, setZielgruppen] = useState<Zielgruppe[]>([]);
  const [activeZielgruppe, setActiveZielgruppe] = useState<string | null>(null);
  const [newZielgruppeName, setNewZielgruppeName] = useState("");
  const [zielgruppeLoading, setZielgruppeLoading] = useState(false);
  const [renamingZielgruppe, setRenamingZielgruppe] = useState<{ id: string; name: string } | null>(null);
  const [memberCsvFile, setMemberCsvFile] = useState<File | null>(null);
  const [memberCsvImporting, setMemberCsvImporting] = useState(false);
  const [memberCsvResult, setMemberCsvResult] = useState<{ inserted: number } | null>(null);
  const [memberCsvZielgruppe, setMemberCsvZielgruppe] = useState<string>("");
  const memberCsvRef = useRef<HTMLInputElement>(null);
  const [newMemberFirst, setNewMemberFirst] = useState("");
  const [newMemberLast, setNewMemberLast] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberZielgruppe, setNewMemberZielgruppe] = useState<string>("");
  const [newMemberLoading, setNewMemberLoading] = useState(false);
  const [newMemberError, setNewMemberError] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [activeEvents, setActiveEvents] = useState<{ id: string; name: string; date: string }[]>([]);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [campaignEventUrl, setCampaignEventUrl] = useState("");
  const [campaignHeaderUrl, setCampaignHeaderUrl] = useState("");
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [headerUploading, setHeaderUploading] = useState(false);
  const headerImageRef = useRef<HTMLInputElement>(null);

  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<"all" | "checkedin" | "pending">("all");
  const [guestSort, setGuestSort] = useState<"name" | "checkin">("name");
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const jsQRRef = useRef<typeof jsQRType | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");
  const savedPassword = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<Record<string, AudioBuffer>>({});

  const loadRegistrations = useCallback(async (pw: string, evId?: string | null) => {
    setLoading(true);
    const url = `/api/registrations?password=${encodeURIComponent(pw)}${evId ? `&eventId=${evId}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.registrations) { setRegistrations(data.registrations); setEvent(data.event); }
    setLoading(false);
  }, []);

  const loadAllEvents = useCallback(async () => {
    if (!savedPassword.current) return;
    setEventsLoading(true);
    const res = await fetch(`/api/admin/events?password=${encodeURIComponent(savedPassword.current)}`);
    const data = await res.json();
    if (Array.isArray(data)) setAllEventCards(data);
    setEventsLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated && savedPassword.current) loadAllEvents();
  }, [authenticated, loadAllEvents]);

  useEffect(() => {
    if (activeTab === "form-regs" && selectedEventId && !formRegsLoaded) {
      setFormRegsLoading(true);
      fetch(`/api/admin/form-registrations?password=${encodeURIComponent(savedPassword.current)}&eventId=${selectedEventId}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setFormRegs(data); setFormRegsLoading(false); setFormRegsLoaded(true); });
    }
  }, [activeTab, selectedEventId, formRegsLoaded]);

  useEffect(() => {
    if (eventSection === "mailing" && selectedEventId && !membersLoaded) {
      setMembersLoading(true);
      setCampaignsLoading(true);
      Promise.all([
        fetch(`/api/members?eventId=${selectedEventId}`).then(r => r.json()),
        fetch(`/api/zielgruppen?eventId=${selectedEventId}`).then(r => r.json()),
        fetch(`/api/campaigns?eventId=${selectedEventId}`).then(r => r.json()),
      ]).then(([members, zielgruppen, campaigns]) => {
        if (Array.isArray(members)) setMembers(members);
        if (Array.isArray(zielgruppen)) setZielgruppen(zielgruppen);
        if (Array.isArray(campaigns)) setCampaigns(campaigns);
        setMembersLoading(false);
        setMembersLoaded(true);
        setCampaignsLoading(false);
      });
    }
  }, [eventSection, selectedEventId, membersLoaded]);

  useEffect(() => {
    const stored = sessionStorage.getItem("adminPw");
    if (!stored) return;
    fetch("/api/registrations?password=" + encodeURIComponent(stored)).then(async (res) => {
      if (res.status === 401) { sessionStorage.removeItem("adminPw"); return; }
      const data = await res.json();
      savedPassword.current = stored;
      setAuthenticated(true);
      setRegistrations(data.registrations || []);
      setEvent(data.event || null);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/registrations?password=" + encodeURIComponent(password));
    if (res.status === 401) { setAuthError("Falsches Passwort."); return; }
    savedPassword.current = password;
    sessionStorage.setItem("adminPw", password);
    setAuthenticated(true);
    const data = await res.json();
    setRegistrations(data.registrations || []);
    setEvent(data.event || null);
  };

  const unlockAndLoadAudio = async () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    // iOS requires resume() inside a user-gesture handler
    if (ctx.state === "suspended") await ctx.resume();
    // Play a silent buffer to fully unlock audio on iOS
    const silent = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start();
    const soundFiles: Record<string, string> = { correct: "/sounds/correct.mp3", wrong: "/sounds/wrong.mp3" };
    await Promise.all((["correct", "wrong"] as const).map(async (name) => {
      const res = await fetch(soundFiles[name]);
      const buf = await res.arrayBuffer();
      soundBuffers.current[name] = await ctx.decodeAudioData(buf);
    }));
  };

  const playSound = async (type: "correct" | "wrong") => {
    const ctx = audioCtxRef.current;
    const buf = soundBuffers.current[type];
    if (!ctx || !buf) return;
    if (ctx.state === "suspended") await ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  };

  const handleScan = async (token: string) => {
    const clean = token.includes("/ticket/") ? token.split("/ticket/")[1] : token;
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: clean, adminPassword: savedPassword.current }),
    });
    const data = await res.json();
    if (!res.ok) {
      playSound("wrong");
      setScanResult({ status: "error", message: data.error });
    } else {
      if (data.status === "success") { playSound("correct"); loadRegistrations(savedPassword.current); }
      else playSound("wrong");
      setScanResult({ status: data.status, name: data.name });
    }
    setTimeout(() => setScanResult(null), 1000);
  };

  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick); return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const jsQR = jsQRRef.current;
    if (jsQR) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
        setTimeout(() => { lastScanRef.current = ""; }, 4000);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = useCallback(async () => {
    await unlockAndLoadAudio();
    if (!jsQRRef.current) {
      const { default: jsQR } = await import("jsqr");
      jsQRRef.current = jsQR;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setScanResult({ status: "error", message: "Kamera konnte nicht gestartet werden." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  useEffect(() => { return () => { stopScanner(); }; }, [stopScanner]);

  useEffect(() => {
    if (activeTab === "scanner" && scanning && streamRef.current && videoRef.current) {
      cancelAnimationFrame(rafRef.current);
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
      rafRef.current = requestAnimationFrame(tick);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const deleteGuest = async (id: string) => {
    const pw = savedPassword.current;
    await fetch(`/api/guest/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: pw }) });
    setExpandedGuest(null);
    setDialog(null);
    loadRegistrations(pw);
  };

  const guestAction = async (id: string, action: "delete" | "checkin" | "uncheckin") => {
    const pw = savedPassword.current;
    if (action === "delete") {
      const name = registrations.find(r => r.id === id)?.name ?? "diesen Gast";
      showConfirm("Gast löschen", `${name} wirklich löschen?`, true, () => deleteGuest(id));
      return;
    }
    await fetch(`/api/guest/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: pw, checked_in: action === "checkin" }) });
    setExpandedGuest(null);
    loadRegistrations(pw);
  };

  const sendQRToGuest = async (reg: Registration) => {
    setSendingQR(reg.id);
    setSendQRStatus(null);
    const res = await fetch("/api/resend-ticket", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: reg.email, adminPassword: savedPassword.current }),
    });
    const data = await res.json();
    setSendingQR(null);
    setSendQRStatus({ id: reg.id, ok: res.ok, msg: res.ok ? `QR-Code gesendet an ${reg.email}` : data.error || "Fehler" });
    setTimeout(() => setSendQRStatus(null), 3000);
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualStatus(null);
    if (!manualVorname.trim() || !manualNachname.trim()) { setManualStatus({ ok: false, msg: "Bitte Vor- und Nachname eingeben." }); return; }
    setManualLoading(true);
    const res = await fetch("/api/admin/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: savedPassword.current, name: `${manualVorname.trim()} ${manualNachname.trim()}`, email: manualEmail, eventId: selectedEventId }),
    });
    const data = await res.json();
    setManualLoading(false);
    if (!res.ok) { setManualStatus({ ok: false, msg: data.error }); }
    else { setManualStatus({ ok: true, msg: `${manualVorname} ${manualNachname} wurde registriert.` }); setManualVorname(""); setManualNachname(""); setManualEmail(""); loadRegistrations(savedPassword.current); }
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true); setCsvResult(null); setCsvSendResult(null);
    const fd = new FormData();
    fd.append("adminPassword", savedPassword.current);
    fd.append("file", csvFile);
    if (selectedEventId) fd.append("eventId", selectedEventId);
    const res = await fetch("/api/admin/import", { method: "POST", body: fd });
    const data = await res.json();
    setCsvImporting(false);
    if (!res.ok) { setCsvResult({ imported: 0, duplicates: [], errors: [data.error] }); }
    else { setCsvResult(data); if (data.imported > 0) loadRegistrations(savedPassword.current, selectedEventId); }
    if (csvInputRef.current) csvInputRef.current.value = "";
    setCsvFile(null);
  };

  const handleSendQRToImported = async () => {
    if (!csvResult || csvResult.imported === 0) return;
    setCsvSending(true); setCsvSendResult(null);
    const res = await fetch(`/api/registrations?password=${encodeURIComponent(savedPassword.current)}`);
    const data = await res.json();
    const allRegs: Registration[] = data.registrations || [];
    const sorted = [...allRegs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const toSend = sorted.slice(0, csvResult.imported);
    let sent = 0, failed = 0;
    for (const r of toSend) {
      const resp = await fetch("/api/resend-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: r.email, adminPassword: savedPassword.current }) });
      if (resp.ok) sent++; else failed++;
    }
    setCsvSending(false);
    setCsvSendResult({ ok: failed === 0, msg: `${sent} QR-Codes gesendet${failed > 0 ? `, ${failed} fehlgeschlagen` : ""}.` });
  };

  const handleSetPassword = async (eventId: string) => {
    const pw = eventPwInputs[eventId] ?? "";
    setEventPwResults(prev => ({ ...prev, [eventId]: null }));
    setEventPwLoading(prev => ({ ...prev, [eventId]: true }));
    const res = await fetch("/api/admin/event", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: savedPassword.current, eventId, registration_password: pw || null }),
    });
    setEventPwLoading(prev => ({ ...prev, [eventId]: false }));
    if (!res.ok) {
      setEventPwResults(prev => ({ ...prev, [eventId]: { ok: false, msg: "Fehler beim Speichern." } }));
    } else {
      setAllEventCards(prev => prev.map(ev => ev.id === eventId ? { ...ev, registration_password: pw || null } : ev));
      setEventPwInputs(prev => ({ ...prev, [eventId]: "" }));
      setEventPwResults(prev => ({ ...prev, [eventId]: { ok: true, msg: pw ? `Code gesetzt: „${pw}"` : "Schutz entfernt." } }));
    }
  };

  const checkedInCount = registrations.filter(r => r.checked_in).length;
  const lastName = (name: string) => name.trim().split(" ").slice(-1)[0] ?? name;
  const filteredGuests = registrations
    .filter(r => {
      if (guestFilter === "checkedin" && !r.checked_in) return false;
      if (guestFilter === "pending" && r.checked_in) return false;
      return guestSearch === "" ||
        r.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
        r.email.toLowerCase().includes(guestSearch.toLowerCase());
    })
    .sort((a, b) => {
      if (guestFilter === "checkedin") {
        return new Date(b.checked_in_at ?? 0).getTime() - new Date(a.checked_in_at ?? 0).getTime();
      }
      return lastName(a.name).localeCompare(lastName(b.name));
    });

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--ig-light)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="Impact Gstaad" className="h-10 mx-auto mb-8 object-contain" />
            <div className="h-px mb-6" style={{ background: "var(--ig-gray2)" }} />
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--ig-navy)" }}>Admin</p>
          </div>

          <Card>
            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin-Passwort"
                    required
                    className={`${inputClass} pr-12`}
                    style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition"
                    style={{ color: "var(--ig-gray3)" }}>
                    <IconEye open={showPassword} />
                  </button>
                </div>
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <div className="flex justify-end"><BtnPrimary type="submit">Anmelden</BtnPrimary></div>
              </form>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // ─── MAIN ADMIN ──────────────────────────────────────────────────────────────
  const selectedEvent = allEventCards.find(e => e.id === selectedEventId) ?? null;
  const eventTabs = [
    ...(selectedEvent?.registration_type === "form"
      ? [{ id: "form-regs" as const, label: "Anmeldungen" }]
      : [
          { id: "scanner" as const, label: "Scanner" },
          { id: "list" as const, label: "Gäste" },
        ]),
    { id: "tools" as const, label: "Tools" },
    { id: "analytics" as const, label: "Statistiken" },
  ];
  const mailingTabs = [
    { id: "compose", label: "Neue Kampagne" },
    { id: "drafts", label: "Entwürfe" },
    { id: "members", label: "Zielgruppen" },
    { id: "campaigns", label: "Archiv" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ig-light)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b w-full" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo — always visible, click goes to events overview */}
            <button
              onClick={() => { setSelectedEventId(null); setEventSection(null); stopScanner(); }}
              className="flex items-center shrink-0"
              title="Zur Event-Übersicht"
            >
              <img src="/logo.png" alt="Impact Gstaad" className="h-7 object-contain" />
            </button>
            {/* Breadcrumb arrow when inside an event */}
            {selectedEventId && (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ig-gray3)", flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <button
                  onClick={() => { setEventSection(null); stopScanner(); }}
                  className="text-sm font-medium truncate max-w-[140px] sm:max-w-xs transition"
                  style={{ color: eventSection ? "var(--ig-gray3)" : "var(--ig-navy)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gold)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = eventSection ? "var(--ig-gray3)" : "var(--ig-navy)"}
                >
                  {selectedEvent?.name ?? "Event"}
                </button>
              </>
            )}
            {selectedEventId && eventSection && (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ig-gray3)", flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span className="text-sm font-semibold truncate max-w-[80px] sm:max-w-xs" style={{ color: "var(--ig-navy)" }}>
                  {eventSection === "mailing" ? "Mailing" : "Management"}
                </span>
              </>
            )}
          </div>
          {(selectedEventId || !selectedEventId) && (
            <div className="flex items-center gap-2">
              {/* Section switcher — only visible inside an event section */}
              {selectedEventId && eventSection && (
                <button
                  onClick={() => { setEventSection(null); stopScanner(); }}
                  title="Bereich wechseln"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                  style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1px solid var(--ig-gray2)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </button>
              )}
              {/* Global scanner button */}
              <div className="relative">
                <button
                  onClick={() => setShowScannerPicker(v => !v)}
                  title="Scanner öffnen"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                  style={{ background: showScannerPicker ? "var(--ig-navy)" : "var(--ig-light)", color: showScannerPicker ? "white" : "var(--ig-navy)", border: "1px solid var(--ig-gray2)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                  onMouseLeave={e => { if (!showScannerPicker) { (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; } }}
                >
                  <IconCamera className="w-4 h-4" />
                </button>
                {showScannerPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowScannerPicker(false)} />
                    <div className="absolute right-0 top-10 z-20 rounded-2xl border shadow-xl overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)", minWidth: 220 }}>
                      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--ig-gray3)" }}>Event wählen</p>
                      </div>
                      {allEventCards.filter(ev => ev.active && new Date(ev.date) >= new Date()).length === 0 ? (
                        <p className="px-4 py-3 text-sm" style={{ color: "var(--ig-gray3)" }}>Keine aktiven Events</p>
                      ) : allEventCards
                        .filter(ev => ev.active && new Date(ev.date) >= new Date())
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(ev => (
                          <button key={ev.id}
                            onClick={() => {
                              setShowScannerPicker(false);
                              setSelectedEventId(ev.id);
                              setEventSection("management");
                              setActiveTab("scanner");
                              setSlugInput(ev.slug ?? "");
                              setSlugStatus(null);
                              setMembersLoaded(false);
                              loadRegistrations(savedPassword.current, ev.id);
                            }}
                            className="w-full text-left px-4 py-3 border-b transition"
                            style={{ borderColor: "var(--ig-gray2)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}
                          >
                            <p className="text-sm font-medium" style={{ color: "var(--ig-navy)" }}>{ev.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>
                              {new Date(ev.date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
                              {ev.location ? ` · ${ev.location}` : ""}
                            </p>
                          </button>
                        ))
                      }
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  if (eventSection === "mailing" && selectedEventId) {
                    if (mailingTab === "compose") return;
                    setMembersLoaded(false);
                    setMembersLoading(true);
                    fetch(`/api/members?eventId=${selectedEventId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d); setMembersLoading(false); setMembersLoaded(true); });
                    setCampaignsLoading(true);
                    fetch(`/api/campaigns?eventId=${selectedEventId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setCampaigns(d); setCampaignsLoading(false); });
                  } else if (eventSection === "management" && selectedEventId) {
                    loadRegistrations(savedPassword.current, selectedEventId);
                  } else {
                    loadAllEvents();
                  }
                }}
                disabled={eventSection === "mailing" && mailingTab === "compose"}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                style={{ color: "var(--ig-gray3)", border: "1px solid var(--ig-gray2)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; }}
              >
                <IconRefresh className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Aktualisieren</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Event Overview (cards) — shown when no event selected ── */}
      {!selectedEventId && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">

          {/* ── Aktiv / Archiv tabs ── */}
          <div className="flex items-center gap-0 mb-5 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
            {(["aktiv", "archiv"] as const).map(tab => (
              <button key={tab} onClick={() => setEventsStatusTab(tab)}
                className="px-5 py-3 text-sm font-semibold tracking-wide transition relative capitalize hover:opacity-70"
                style={{ color: eventsStatusTab === tab ? "var(--ig-gold)" : "var(--ig-navy)" }}>
                {tab === "aktiv" ? "Aktiv" : "Archiv"}
                {eventsStatusTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--ig-gold)" }} />}
              </button>
            ))}
            <div className="flex-1" />
            <BtnPrimary onClick={() => { setShowCreateEvent(v => !v); setNewEventResult(null); }} className="mb-3">
              <IconPlus className="w-3.5 h-3.5" />
              Neuer Event
            </BtnPrimary>
          </div>

          {/* ── Toolbar: category filter (scrollable) + sort/view ── */}
          {/* Category pills — single scrollable row */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setEventsCategory(null)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition border flex-shrink-0"
              style={{ background: eventsCategory === null ? "var(--ig-navy)" : "white", color: eventsCategory === null ? "white" : "var(--ig-navy)", borderColor: eventsCategory === null ? "var(--ig-navy)" : "var(--ig-gray2)" }}>
              Alle
            </button>
            {EVENT_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setEventsCategory(eventsCategory === cat ? null : cat)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition border flex-shrink-0"
                style={{ background: eventsCategory === cat ? "var(--ig-navy)" : "white", color: eventsCategory === cat ? "white" : "var(--ig-navy)", borderColor: eventsCategory === cat ? "var(--ig-navy)" : "var(--ig-gray2)" }}>
                {cat}
              </button>
            ))}
          </div>
          {/* Sort + view toggle */}
          <div className="flex items-center gap-2 mb-5">
            {/* Custom sort button */}
            {(() => {
              const sortLabels: Record<string, string> = { "date-desc": "Datum ↓", "date-asc": "Datum ↑", "name-asc": "Name A–Z", "created-desc": "Neu zuerst" };
              const sortOptions = ["date-desc", "date-asc", "name-asc", "created-desc"] as const;
              return (
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowSortMenu(v => !v)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition"
                    style={{ borderColor: showSortMenu ? "var(--ig-navy)" : "var(--ig-gray2)", color: "var(--ig-navy)", background: "white" }}>
                    <span>{sortLabels[eventsSort]}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: showSortMenu ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0, color: "var(--ig-gray3)" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border overflow-hidden z-20 shadow-lg" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
                        {sortOptions.map((opt, i) => (
                          <button key={opt} onClick={() => { setEventsSort(opt); setShowSortMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition flex items-center justify-between${i > 0 ? " border-t" : ""}`}
                            style={{ borderColor: "var(--ig-gray2)", color: eventsSort === opt ? "var(--ig-gold)" : "var(--ig-navy)", background: eventsSort === opt ? "rgba(210,141,40,0.06)" : "white", fontWeight: eventsSort === opt ? 600 : 400 }}>
                            {sortLabels[opt]}
                            {eventsSort === opt && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            {/* View toggle */}
            <div className="flex rounded-xl border overflow-hidden flex-shrink-0" style={{ borderColor: "var(--ig-gray2)" }}>
              {(["grid", "list"] as const).map(v => (
                <button key={v} onClick={() => setEventsView(v)}
                  className="px-3 py-2.5 transition"
                  style={{ background: eventsView === v ? "var(--ig-navy)" : "white", color: eventsView === v ? "white" : "var(--ig-gray3)" }}>
                  {v === "grid" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Create event form */}
          {showCreateEvent && (
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-navy)" }} />
              <div className="p-5 space-y-3">
                <p className="text-xs font-semibold tracking-wide" style={{ color: "var(--ig-gray3)" }}>NEUER EVENT</p>
                <input type="text" value={newEventName} onChange={e => setNewEventName(e.target.value)}
                  placeholder="Event-Name *" className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                <select value={newEventCategory} onChange={e => setNewEventCategory(e.target.value)}
                  className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}>
                  <option value="">Kategorie (optional)</option>
                  {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="datetime-local" value={newEventDate} onChange={e => setNewEventDate(e.target.value)}
                  className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)}
                  placeholder="Ort *" className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                <input type="text" value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)}
                  placeholder="Beschreibung (optional)" className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                <input type="text" value={newEventPw} onChange={e => setNewEventPw(e.target.value)}
                  placeholder="Zugangscode für Portal (optional)" className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                <select value={newEventRegType} onChange={e => setNewEventRegType(e.target.value as "invite" | "form")}
                  className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}>
                  <option value="invite">Einladung (Ticket-Code)</option>
                  <option value="form">Formular-Anmeldung</option>
                </select>
                {newEventRegType === "form" && (
                  <input type="number" min={1} value={newEventMaxCapacity} onChange={e => setNewEventMaxCapacity(e.target.value)}
                    placeholder="Max. Gästeanzahl (optional)" className={inputClass} style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                )}
                {newEventResult && (
                  <p className={`text-xs ${newEventResult.ok ? "text-green-600" : "text-red-500"}`}>{newEventResult.msg}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setShowCreateEvent(false); setNewEventResult(null); }}
                    className="text-sm transition"
                    style={{ color: "var(--ig-gray3)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}
                  >Abbrechen</button>
                  <BtnPrimary
                    disabled={newEventLoading || !newEventName.trim() || !newEventDate || !newEventLocation.trim()}
                    onClick={async () => {
                      setNewEventLoading(true); setNewEventResult(null);
                      try {
                        const res = await fetch("/api/admin/events", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ adminPassword: savedPassword.current, name: newEventName, date: newEventDate, location: newEventLocation, description: newEventDesc, registration_password: newEventPw, category: newEventCategory || null, registration_type: newEventRegType, max_capacity: newEventMaxCapacity || null }),
                        });
                        const d = await res.json();
                        if (!res.ok) { setNewEventResult({ ok: false, msg: d.error || "Fehler beim Erstellen." }); return; }
                        setNewEventName(""); setNewEventDate(""); setNewEventLocation(""); setNewEventDesc(""); setNewEventPw(""); setNewEventCategory(""); setNewEventRegType("invite"); setNewEventMaxCapacity("");
                        setShowCreateEvent(false);
                        loadAllEvents();
                      } catch {
                        setNewEventResult({ ok: false, msg: "Netzwerkfehler." });
                      } finally {
                        setNewEventLoading(false);
                      }
                    }}
                  >
                    {newEventLoading ? "Erstellt…" : "Erstellen"}
                  </BtnPrimary>
                </div>
              </div>
            </Card>
          )}

          {/* Event list / grid */}
          {eventsLoading ? (
            <div className="py-12 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Lädt…</div>
          ) : (() => {
            const now = new Date();
            const filtered = allEventCards
              .filter(ev => {
                const isPast = new Date(ev.date) < now;
                return eventsStatusTab === "aktiv" ? (ev.active && !isPast) : (!ev.active || isPast);
              })
              .filter(ev => eventsCategory === null || ev.category === eventsCategory)
              .sort((a, b) => {
                if (eventsSort === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
                if (eventsSort === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
                if (eventsSort === "name-asc") return a.name.localeCompare(b.name);
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });

            if (filtered.length === 0) return (
              <div className="py-12 text-center">
                <p className="text-sm mb-4" style={{ color: "var(--ig-gray3)" }}>
                  {allEventCards.length === 0 ? "Noch keine Events." : "Keine Events in dieser Ansicht."}
                </p>
                {allEventCards.length === 0 && <BtnPrimary onClick={() => setShowCreateEvent(true)}><IconPlus className="w-3.5 h-3.5" />Ersten Event erstellen</BtnPrimary>}
              </div>
            );

            const openEvent = (ev: EventCard) => {
              setSelectedEventId(ev.id);
              setEventSection(null);
              setActiveTab(ev.registration_type === "form" ? "form-regs" : "list");
              setSlugInput(ev.slug ?? "");
              setSlugStatus(null);
              setRegTypeInput(ev.registration_type ?? "invite");
              setMaxCapInput(ev.max_capacity?.toString() ?? "");
              setRegTypeStatus(null);
              setFormConfig(ev.form_config ?? DEFAULT_FORM_CONFIG);
              setFormConfigStatus(null);
              setMembersLoaded(false);
              setFormRegsLoaded(false);
              if (ev.registration_type !== "form") loadRegistrations(savedPassword.current, ev.id);
            };

            const duplicateEvent = async (ev: EventCard) => {
              setDuplicatingId(ev.id);
              await fetch("/api/admin/events", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminPassword: savedPassword.current, name: `${ev.name} (Kopie)`, date: ev.date, location: ev.location, description: ev.description, registration_password: ev.registration_password, category: ev.category }),
              });
              setDuplicatingId(null);
              loadAllEvents();
            };

            if (eventsView === "list") return (
              <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
                {filtered.map((ev, i) => {
                  const evDate = new Date(ev.date);
                  const isPast = evDate < now;
                  return (
                    <div key={ev.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--ig-gray2)" }}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--ig-light)] transition group">
                        <button className="flex-1 flex items-center gap-3 min-w-0 text-left" onClick={() => openEvent(ev)}>
                          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: ev.active ? (isPast ? "var(--ig-gold)" : "#16a34a") : "var(--ig-gray2)" }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate" style={{ color: "var(--ig-navy)" }}>{ev.name}</p>
                              {ev.category && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1px solid var(--ig-gray2)" }}>{ev.category}</span>}
                            </div>
                            <p className="text-xs truncate" style={{ color: "var(--ig-gray3)" }}>
                              {evDate.toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
                              {ev.location && ` · ${ev.location}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold" style={{ color: "var(--ig-gold)" }}>{ev.checked_in}<span className="text-xs font-normal" style={{ color: "var(--ig-gray3)" }}>/{ev.total}</span></p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                          <button title="Duplizieren" disabled={duplicatingId === ev.id}
                            onClick={e => { e.stopPropagation(); duplicateEvent(ev); }}
                            className="p-1.5 rounded-lg transition" style={{ color: "var(--ig-gray3)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          </button>
                          {ev.active ? (
                            <button title="Archivieren"
                              onClick={e => { e.stopPropagation(); showConfirm("Event archivieren", `„${ev.name}" archivieren?`, false, async () => { await fetch(`/api/admin/events/${ev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: savedPassword.current, active: false }) }); setDialog(null); loadAllEvents(); }); }}
                              className="p-1.5 rounded-lg transition" style={{ color: "var(--ig-gray3)" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gold)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                            </button>
                          ) : (
                            <button title="Reaktivieren"
                              onClick={e => { e.stopPropagation(); fetch(`/api/admin/events/${ev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: savedPassword.current, active: true }) }).then(() => loadAllEvents()); }}
                              className="p-1.5 rounded-lg transition" style={{ color: "var(--ig-gray3)" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#16a34a"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            </button>
                          )}
                          <button title="Löschen"
                            onClick={e => { e.stopPropagation(); showConfirm("Event löschen", `„${ev.name}" und alle zugehörigen Daten löschen? Nicht rückgängig zu machen.`, true, async () => { await fetch(`/api/admin/events/${ev.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: savedPassword.current }) }); setDialog(null); loadAllEvents(); }); }}
                            className="p-1.5 rounded-lg transition" style={{ color: "var(--ig-gray3)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );

            // Grid view
            return (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map(ev => {
                  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                  const portalUrl = ev.slug ? `${appUrl}/${ev.slug}` : `${appUrl}/?event=${ev.id}`;
                  const evDate = new Date(ev.date);
                  const isPast = evDate < now;
                  return (
                    <div key={ev.id} className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
                      <div className="h-0.5" style={{ background: ev.active ? `linear-gradient(90deg, var(--ig-navy), var(--ig-gold))` : "var(--ig-gray2)" }} />
                      <button className="w-full text-left p-5 transition" style={{ background: "transparent" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        onClick={() => openEvent(ev)}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                background: ev.active ? (isPast ? "rgba(210,141,40,0.10)" : "#dcfce7") : "var(--ig-light)",
                                color: ev.active ? (isPast ? "var(--ig-gold)" : "#16a34a") : "var(--ig-gray3)",
                              }}>
                                {ev.active ? (isPast ? "Vergangen" : "Aktiv") : "Archiviert"}
                              </span>
                              {ev.category && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1px solid var(--ig-gray2)" }}>{ev.category}</span>}
                              {ev.registration_password && <IconLock className="w-3 h-3" style={{ color: "var(--ig-gray3)" }} />}
                            </div>
                            <p className="font-semibold text-sm leading-snug" style={{ color: "var(--ig-navy)" }}>{ev.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>
                              {evDate.toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
                              {ev.location && ` · ${ev.location}`}
                            </p>
                            {ev.slug && <p className="text-xs mt-1 font-mono" style={{ color: "var(--ig-gold)" }}>/{ev.slug}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold leading-none" style={{ color: "var(--ig-gold)" }}>{ev.checked_in}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>/ {ev.total}</p>
                          </div>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ig-light)" }}>
                          <div className="h-full rounded-full transition-all" style={{ background: "var(--ig-gold)", width: ev.total > 0 ? `${Math.round((ev.checked_in / ev.total) * 100)}%` : "0%" }} />
                        </div>
                      </button>
                      <div className="px-4 pb-3 pt-2.5 flex items-center gap-1.5 border-t" style={{ borderColor: "var(--ig-gray2)" }}>
                        {/* Portal */}
                        <a href={portalUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          title="Portal öffnen"
                          className="p-2 rounded-lg transition flex items-center justify-center"
                          style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-navy)", background: "white" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gold)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-gold)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                        </a>
                        {/* CSV */}
                        <a href={`/api/export?password=${encodeURIComponent(savedPassword.current)}&type=all&eventId=${ev.id}`}
                          target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          title="CSV exportieren"
                          className="p-2 rounded-lg transition flex items-center justify-center"
                          style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-navy)", background: "white" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.background = "white"; }}>
                          <IconDownload className="w-3.5 h-3.5" />
                        </a>
                        {/* Kopie */}
                        <button title="Duplizieren" disabled={duplicatingId === ev.id}
                          onClick={e => { e.stopPropagation(); duplicateEvent(ev); }}
                          className="p-2 rounded-lg transition flex items-center justify-center"
                          style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-navy)", background: "white" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.background = "white"; }}>
                          {duplicatingId === ev.id ? <span className="text-xs px-0.5">…</span> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
                        </button>
                        <div className="flex-1" />
                        {/* Archivieren / Reaktivieren */}
                        <button onClick={e => { e.stopPropagation(); showConfirm(
                            ev.active ? "Event archivieren" : "Event reaktivieren",
                            ev.active ? `„${ev.name}" archivieren?` : `„${ev.name}" reaktivieren?`,
                            false,
                            async () => { await fetch(`/api/admin/events/${ev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: savedPassword.current, active: !ev.active }) }); setDialog(null); loadAllEvents(); }
                          ); }}
                          title={ev.active ? "Archivieren" : "Reaktivieren"}
                          className="p-2 rounded-lg transition flex items-center justify-center"
                          style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-gray3)", background: "white" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ev.active ? "var(--ig-gold)" : "#16a34a"; (e.currentTarget as HTMLElement).style.color = ev.active ? "var(--ig-gold)" : "#16a34a"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"; }}>
                          {ev.active
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
                        </button>
                        {/* Löschen */}
                        <button onClick={e => { e.stopPropagation(); showConfirm("Event löschen", `„${ev.name}" und alle Daten löschen? Nicht rückgängig zu machen.`, true, async () => { await fetch(`/api/admin/events/${ev.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword: savedPassword.current }) }); setDialog(null); loadAllEvents(); }); }}
                          title="Löschen"
                          className="p-2 rounded-lg transition flex items-center justify-center"
                          style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-gray3)", background: "white" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"; }}>
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Event section picker (Mailing | Event-Management) ── */}
      {selectedEventId && eventSection === null && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--ig-gray3)" }}>{selectedEvent?.name}</p>
          <p className="text-xs mb-6" style={{ color: "var(--ig-gray3)" }}>
            {selectedEvent?.date ? new Date(selectedEvent.date).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" }) : ""}
            {selectedEvent?.location ? ` · ${selectedEvent.location}` : ""}
          </p>
          <div className="flex gap-5">
            {([
              {
                key: "mailing" as const,
                label: "Mailing",
                sub: "Mitglieder, Kampagnen, Entwürfe",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                ),
              },
              {
                key: "management" as const,
                label: "Event-Management",
                sub: "Scanner, Gäste, Tools",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    <circle cx="8" cy="15" r="1" fill="white" stroke="none"/>
                    <circle cx="12" cy="15" r="1" fill="white" stroke="none"/>
                    <circle cx="16" cy="15" r="1" fill="white" stroke="none"/>
                  </svg>
                ),
              },
            ]).map(({ key, label, svg }) => (
              <button
                key={key}
                onClick={() => setEventSection(key)}
                className="flex-1 rounded-2xl border p-8 text-left transition"
                style={{ background: "white", borderColor: "var(--ig-gray2)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gold)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(210,141,40,0.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--ig-navy)" }}>{svg}</div>
                <p className="font-bold text-base" style={{ color: "var(--ig-navy)" }}>{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Management tabs ── */}
      {selectedEventId && eventSection === "management" && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6">
          <div className="flex border-b mb-6" style={{ borderColor: "var(--ig-gray2)" }}>
            {eventTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3.5 text-sm font-semibold tracking-wide transition relative"
                style={{ color: activeTab === tab.id ? "var(--ig-gold)" : "var(--ig-navy)" }}>
                {tab.label}
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--ig-gold)" }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mailing tabs — sticky below header ── */}
      {selectedEventId && eventSection === "mailing" && (
        <div className="sticky top-14 z-10 border-b" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
            <div className="flex">
              {mailingTabs.map(tab => (
                <button key={tab.id} onClick={() => setMailingTab(tab.id as typeof mailingTab)}
                  className="flex-1 py-3.5 text-sm font-semibold tracking-wide transition relative hover:opacity-70"
                  style={{ color: mailingTab === tab.id ? "var(--ig-gold)" : "var(--ig-navy)" }}>
                  {tab.label}
                  {mailingTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--ig-gold)" }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content (event detail + mailing) ── */}
      {selectedEventId && eventSection !== null && (
      <div
        className="mx-auto w-full px-4 sm:px-6 pb-6 pt-6 flex-1"
        style={{
          maxWidth: eventSection === "mailing" && mailingTab === "compose" ? "100%" : "56rem",
          transition: "max-width 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >

        {/* ── Filter Pills ── */}
        {eventSection === "management" && activeTab === "list" && (
          <div className="flex gap-2 mb-5 flex-wrap justify-center">
            {([
              { label: "Alle", value: registrations.length, filter: "all" as const },
              { label: "Eingecheckt", value: checkedInCount, filter: "checkedin" as const },
              { label: "Ausstehend", value: registrations.length - checkedInCount, filter: "pending" as const },
            ]).map(({ label, value, filter }) => {
              const active = guestFilter === filter;
              return (
                <button
                  key={label}
                  onClick={() => { setGuestFilter(active && filter !== "all" ? "all" : filter); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border"
                  style={{
                    background: active ? "var(--ig-navy)" : "white",
                    color: active ? "white" : "var(--ig-navy)",
                    borderColor: active ? "var(--ig-navy)" : "var(--ig-gray2)",
                  }}
                >
                  {label}
                  <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{
                    background: active ? "rgba(255,255,255,0.2)" : "var(--ig-light)",
                    color: active ? "white" : "var(--ig-navy)",
                  }}>{value}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ═══════════ SCANNER TAB ═══════════ */}
        {eventSection === "management" && activeTab === "scanner" && (
          <div className="sm:max-w-sm sm:mx-auto">

            {/* Camera card */}
            <div className="sm:rounded-3xl overflow-hidden border-y sm:border shadow-sm" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>

              {/* Gold top accent */}
              <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, var(--ig-gold), transparent)` }} />

              {/* Camera area — capped so button stays visible without scrolling */}
              <div ref={scannerRef} className="relative overflow-hidden" style={{ aspectRatio: "1", maxHeight: "calc(100svh - 260px)" }}>
                <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`} />
                <canvas ref={canvasRef} className="hidden" />

                {/* Idle state */}
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "var(--ig-light)" }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "white", border: "1.5px solid var(--ig-gray2)", boxShadow: "0 2px 8px rgba(30,50,99,0.07)" }}>
                      <IconCamera className="w-7 h-7" style={{ color: "var(--ig-navy)" }} />
                    </div>
                    <p className="text-xs tracking-[0.15em] uppercase font-medium" style={{ color: "var(--ig-gray3)" }}>
                      Kamera nicht aktiv
                    </p>
                  </div>
                )}

                {/* Viewfinder corners */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8">
                      <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: "var(--ig-gold)" }} />
                      <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: "var(--ig-gold)" }} />
                      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: "var(--ig-gold)" }} />
                      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: "var(--ig-gold)" }} />
                    </div>
                  </div>
                )}

                {/* Scan result overlay */}
                {scanResult && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
                    style={{ background: scanResult.status === "success" ? "rgba(22,163,74,0.95)" : "rgba(220,38,38,0.95)" }}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                      {scanResult.status === "success"
                        ? <IconCheck className="w-7 h-7 text-white" />
                        : <IconX className="w-7 h-7 text-white" />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-2xl leading-tight">
                        {scanResult.status === "success" || scanResult.status === "already_checked_in"
                          ? scanResult.name
                          : (scanResult.message || "Ungültiger QR-Code")}
                      </p>
                      {scanResult.status === "already_checked_in" && (
                        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Bereits eingecheckt</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom controls */}
              <div className="px-5 py-4 border-t" style={{ borderColor: "var(--ig-gray2)" }}>
                {!scanning ? (
                  <button
                    onClick={startScanner}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition text-white"
                    style={{ background: "var(--ig-gold)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#B8791F"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-gold)"}
                  >
                    <IconCamera className="w-4 h-4" />
                    Kamera starten
                  </button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition"
                    style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)", background: "white" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; }}
                  >
                    Stoppen
                  </button>
                )}
              </div>
            </div>

            {/* Status line below card */}
            <p className="text-center text-xs mt-4 tracking-wide px-4" style={{ color: "var(--ig-gray3)" }}>
              {scanning ? "QR-Code vor die Kamera halten" : "Tippe auf «Kamera starten» um zu scannen"}
            </p>
          </div>
        )}

        {/* ═══════════ GÄSTE TAB ═══════════ */}
        {eventSection === "management" && activeTab === "list" && (
          <div className="space-y-4">
            {/* Manual add */}
            <Card>
              <button
                onClick={() => { setManualForm(v => !v); setManualStatus(null); }}
                className="w-full px-5 py-4 flex items-center justify-between transition"
                style={{ color: "var(--ig-navy)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}
              >
                <span className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                  <IconPlus className="w-4 h-4" style={{ color: "var(--ig-gold)" } } />
                  Gast manuell erfassen
                </span>
                <IconChevron down={!manualForm} className="w-4 h-4" style={{ color: "var(--ig-gray3)" } } />
              </button>
              {manualForm && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--ig-gray2)" }}>
                  <form onSubmit={handleManualRegister} className="space-y-3 pt-4" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={manualVorname} onChange={e => setManualVorname(e.target.value)}
                        placeholder="Vorname" className={inputClass} style={inputStyle}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                      <input type="text" value={manualNachname} onChange={e => setManualNachname(e.target.value)}
                        placeholder="Nachname" className={inputClass} style={inputStyle}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                    </div>
                    <input type="text" value={manualEmail} onChange={e => setManualEmail(e.target.value)}
                      placeholder="E-Mail-Adresse" className={inputClass} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                    {manualStatus && (
                      <p className={`text-xs ${manualStatus.ok ? "text-green-600" : "text-red-500"}`}>{manualStatus.msg}</p>
                    )}
                    <div className="flex justify-end"><BtnPrimary type="submit" disabled={manualLoading}>{manualLoading ? "Wird gespeichert…" : "Speichern"}</BtnPrimary></div>
                  </form>
                </div>
              )}
            </Card>

            {/* Search + Sort */}
            <input
              type="text"
              value={guestSearch}
              onChange={e => setGuestSearch(e.target.value)}
              placeholder="Gäste suchen…"
              className={inputClass}
              style={{ ...inputStyle, display: "block" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
            />
            {/* Guest list */}
            <Card>
              {loading ? (
                <div className="p-10 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Lädt…</div>
              ) : filteredGuests.length === 0 ? (
                <div className="p-10 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>
                  {guestSearch ? "Keine Treffer." : "Noch keine Anmeldungen."}
                </div>
              ) : (
                <div className="divide-y divide-[#D0DDEA]">
                  {filteredGuests.map(r => (
                    <div key={r.id}>
                      <button
                        onClick={() => setExpandedGuest(expandedGuest === r.id ? null : r.id)}
                        className="w-full px-5 py-3.5 flex items-center gap-3 text-left transition"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--ig-black)" }}>{r.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--ig-gray3)" }}>{r.email}</p>
                        </div>
                        {r.checked_in && (
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
                              <IconCheck className="w-3 h-3" />
                              Eingecheckt
                            </span>
                            {r.checked_in_at && (
                              <span className="text-xs" style={{ color: "var(--ig-gray3)" }}>
                                {new Date(r.checked_in_at).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                        )}
                        <IconChevron down={expandedGuest !== r.id} className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--ig-gray3)" } } />
                      </button>

                      {expandedGuest === r.id && (
                        <div className="px-5 pb-4 border-t space-y-2" style={{ borderColor: "var(--ig-gray2)", background: "var(--ig-light)" }}>
                          <div className="flex gap-2 pt-3 flex-wrap">
                            {r.checked_in ? (
                              <BtnOutline onClick={() => guestAction(r.id, "uncheckin")} className="flex-1">
                                <IconX className="w-3.5 h-3.5" />Auschecken
                              </BtnOutline>
                            ) : (
                              <BtnOutline onClick={() => guestAction(r.id, "checkin")} className="flex-1">
                                <IconCheck className="w-3.5 h-3.5" style={{ color: "var(--ig-gold)" } } />Einchecken
                              </BtnOutline>
                            )}
                            <BtnOutline onClick={() => sendQRToGuest(r)} disabled={sendingQR === r.id} className="flex-1">
                              <IconMail className="w-3.5 h-3.5" />
                              {sendingQR === r.id ? "…" : "QR senden"}
                            </BtnOutline>
                            <BtnOutline onClick={() => guestAction(r.id, "delete")} className="flex-1">
                              <IconTrash className="w-3.5 h-3.5" style={{ color: "#dc2626" } } />
                              <span style={{ color: "#dc2626" }}>Löschen</span>
                            </BtnOutline>
                          </div>
                          {sendQRStatus?.id === r.id && (
                            <p className={`text-xs ${sendQRStatus.ok ? "text-green-600" : "text-red-500"}`}>{sendQRStatus.msg}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ═══════════ TOOLS TAB ═══════════ */}
        {eventSection === "management" && activeTab === "tools" && selectedEvent && (
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 items-start">

            {/* Anmeldeseite sperren */}
            {(() => { const ev = selectedEvent; return (
              <Card key={ev.id}>
                <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
                <CardHeader title="Anmeldeseite sperren" />
                <div className="p-5">
                  <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: ev.registration_password ? "rgba(210,141,40,0.08)" : "var(--ig-light)", border: `1px solid ${ev.registration_password ? "rgba(210,141,40,0.2)" : "var(--ig-gray2)"}` }}>
                    <IconLock className="w-4 h-4 flex-shrink-0" style={{ color: ev.registration_password ? "var(--ig-gold)" : "var(--ig-gray3)" }} />
                    <div>
                      <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>Aktueller Code</p>
                      <p className="text-sm font-semibold font-mono" style={{ color: ev.registration_password ? "var(--ig-gold)" : "var(--ig-gray3)" }}>
                        {ev.registration_password ?? "Kein Schutz aktiv"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input type="text" value={eventPwInputs[ev.id] ?? ""} onChange={e => setEventPwInputs(prev => ({ ...prev, [ev.id]: e.target.value }))}
                      placeholder="Neuer Code (leer = kein Schutz)"
                      className={inputClass} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                      onKeyDown={e => e.key === "Enter" && handleSetPassword(ev.id)} />
                    {eventPwResults[ev.id] && (
                      <p className={`text-xs ${eventPwResults[ev.id]!.ok ? "text-green-600" : "text-red-500"}`}>{eventPwResults[ev.id]!.msg}</p>
                    )}
                    <div className="flex justify-end">
                      <BtnPrimary onClick={() => handleSetPassword(ev.id)} disabled={!!eventPwLoading[ev.id]}>
                        {eventPwLoading[ev.id] ? "Speichert…" : "Speichern"}
                      </BtnPrimary>
                    </div>
                  </div>
                </div>
              </Card>
            ); })()}

            {/* Portal-URL */}
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
              <CardHeader title="Portal-URL" subtitle="Eigene URL für das Registrationsportal" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-mono" style={{ background: "var(--ig-light)", border: "1px solid var(--ig-gray2)", color: "var(--ig-gray3)" }}>
                  <span>impactgstaad.vercel.app/</span>
                  <span style={{ color: slugInput ? "var(--ig-navy)" : "var(--ig-gray3)", fontWeight: slugInput ? 600 : 400 }}>{slugInput || "event-name"}</span>
                </div>
                <input
                  type="text"
                  value={slugInput}
                  onChange={e => {
                    setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                    setSlugStatus(null);
                  }}
                  placeholder="z.B. sustainable-alpine-2026"
                  className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                />
                {slugStatus && <p className={`text-xs ${slugStatus.ok ? "text-green-600" : "text-red-500"}`}>{slugStatus.msg}</p>}
                <div className="flex justify-end">
                  <BtnPrimary
                    disabled={slugSaving || !selectedEventId}
                    onClick={async () => {
                      if (!selectedEventId) return;
                      setSlugSaving(true); setSlugStatus(null);
                      const res = await fetch(`/api/admin/events/${selectedEventId}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminPassword: savedPassword.current, slug: slugInput || null }),
                      });
                      setSlugSaving(false);
                      if (!res.ok) { setSlugStatus({ ok: false, msg: "Fehler – URL bereits vergeben?" }); return; }
                      const cleanSlug = slugInput.replace(/^-|-$/g, '') || null;
                      setAllEventCards(prev => prev.map(e => e.id === selectedEventId ? { ...e, slug: cleanSlug } : e));
                      setSlugStatus({ ok: true, msg: cleanSlug ? `URL gesetzt: /${cleanSlug}` : "URL entfernt." });
                    }}
                  >
                    {slugSaving ? "Speichert…" : "Speichern"}
                  </BtnPrimary>
                </div>
              </div>
            </Card>

            {/* Anmeldemodus */}
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
              <CardHeader title="Anmeldemodus" subtitle="Einladung (Ticket) oder Formular-Anmeldung" />
              <div className="p-5 space-y-3">
                <select value={regTypeInput} onChange={e => { setRegTypeInput(e.target.value as "invite" | "form"); setRegTypeStatus(null); }}
                  className={inputClass} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}>
                  <option value="invite">Einladung (Ticket-Code)</option>
                  <option value="form">Formular-Anmeldung</option>
                </select>
                {regTypeInput === "form" && (
                  <input type="number" min={1} value={maxCapInput} onChange={e => { setMaxCapInput(e.target.value); setRegTypeStatus(null); }}
                    placeholder="Max. Gästeanzahl (leer = unbegrenzt)"
                    className={inputClass} style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                )}
                {regTypeStatus && <p className={`text-xs ${regTypeStatus.ok ? "text-green-600" : "text-red-500"}`}>{regTypeStatus.msg}</p>}
                <div className="flex justify-end">
                  <BtnPrimary disabled={regTypeSaving || !selectedEventId} onClick={async () => {
                    if (!selectedEventId) return;
                    setRegTypeSaving(true); setRegTypeStatus(null);
                    const res = await fetch(`/api/admin/events/${selectedEventId}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ adminPassword: savedPassword.current, registration_type: regTypeInput, max_capacity: maxCapInput || null }),
                    });
                    setRegTypeSaving(false);
                    if (!res.ok) { setRegTypeStatus({ ok: false, msg: "Fehler beim Speichern." }); return; }
                    setAllEventCards(prev => prev.map(e => e.id === selectedEventId ? { ...e, registration_type: regTypeInput, max_capacity: maxCapInput ? Number(maxCapInput) : null } : e));
                    setRegTypeStatus({ ok: true, msg: "Gespeichert." });
                    setFormRegsLoaded(false);
                  }}>
                    {regTypeSaving ? "Speichert…" : "Speichern"}
                  </BtnPrimary>
                </div>
              </div>
            </Card>

            {/* Formular konfigurieren (nur bei form-type) */}
            {selectedEvent?.registration_type === "form" && (
              <Card>
                <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
                <CardHeader title="Formular konfigurieren" subtitle="Felder, Labels und Intro-Text" />
                <div className="p-5 space-y-4">
                  {/* Intro */}
                  <div>
                    <label className="block text-xs font-semibold tracking-wide mb-1.5" style={{ color: "var(--ig-gray3)" }}>INTRO-TEXT</label>
                    <textarea
                      value={formConfig.intro}
                      onChange={e => setFormConfig(c => ({ ...c, intro: e.target.value }))}
                      rows={2}
                      placeholder="Optionaler Text über dem Formular"
                      className={`${inputClass} resize-none`} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                    />
                  </div>

                  {/* Fields */}
                  <div>
                    <label className="block text-xs font-semibold tracking-wide mb-2" style={{ color: "var(--ig-gray3)" }}>FELDER</label>
                    <div className="space-y-2">
                      {formConfig.fields.map((field, idx) => (
                        <div key={field.id} className="rounded-xl border p-3 space-y-2" style={{ background: field.visible ? "white" : "var(--ig-light)", borderColor: "var(--ig-gray2)" }}>
                          <div className="flex items-center gap-2">
                            {/* drag handle placeholder */}
                            <span className="text-gray-300 select-none cursor-grab">⠿</span>
                            <input
                              type="text"
                              value={field.label}
                              onChange={e => setFormConfig(c => ({ ...c, fields: c.fields.map((f, i) => i === idx ? { ...f, label: e.target.value } : f) }))}
                              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                              style={{ border: "1.5px solid var(--ig-gray2)", background: "var(--ig-light)" }}
                              onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                              onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"}
                            />
                            {!BUILTIN_FIELD_IDS.includes(field.id) && (
                              <select
                                value={field.type}
                                onChange={e => setFormConfig(c => ({ ...c, fields: c.fields.map((f, i) => i === idx ? { ...f, type: e.target.value as "text" | "textarea" } : f) }))}
                                className="text-xs px-2 py-1.5 rounded-lg outline-none"
                                style={{ border: "1.5px solid var(--ig-gray2)", background: "var(--ig-light)", color: "var(--ig-navy)" }}
                              >
                                <option value="text">Einzeilig</option>
                                <option value="textarea">Mehrzeilig</option>
                              </select>
                            )}
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "var(--ig-gray3)" }}>
                              <input type="checkbox" checked={field.required} onChange={e => setFormConfig(c => ({ ...c, fields: c.fields.map((f, i) => i === idx ? { ...f, required: e.target.checked } : f) }))} />
                              Pflicht
                            </label>
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "var(--ig-gray3)" }}>
                              <input type="checkbox" checked={field.visible} onChange={e => setFormConfig(c => ({ ...c, fields: c.fields.map((f, i) => i === idx ? { ...f, visible: e.target.checked } : f) }))} />
                              Aktiv
                            </label>
                            {!BUILTIN_FIELD_IDS.includes(field.id) && (
                              <button
                                onClick={() => setFormConfig(c => ({ ...c, fields: c.fields.filter((_, i) => i !== idx) }))}
                                className="text-red-400 hover:text-red-600 transition text-sm leading-none"
                              >✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add custom field */}
                    <button
                      onClick={() => setFormConfig(c => ({ ...c, fields: [...c.fields, { id: `custom_${Math.random().toString(36).slice(2,8)}`, type: "text", label: "Neues Feld", required: false, visible: true }] }))}
                      className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition"
                      style={{ border: "1.5px dashed var(--ig-gray2)", color: "var(--ig-gray3)", background: "transparent" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gold)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-gold)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"; }}
                    >
                      <IconPlus className="w-3.5 h-3.5" /> Feld hinzufügen
                    </button>
                  </div>

                  {formConfigStatus && <p className={`text-xs ${formConfigStatus.ok ? "text-green-600" : "text-red-500"}`}>{formConfigStatus.msg}</p>}
                  <div className="flex justify-end">
                    <BtnPrimary disabled={formConfigSaving || !selectedEventId} onClick={async () => {
                      if (!selectedEventId) return;
                      setFormConfigSaving(true); setFormConfigStatus(null);
                      const res = await fetch(`/api/admin/events/${selectedEventId}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminPassword: savedPassword.current, form_config: formConfig }),
                      });
                      setFormConfigSaving(false);
                      if (!res.ok) { setFormConfigStatus({ ok: false, msg: "Fehler beim Speichern." }); return; }
                      setAllEventCards(prev => prev.map(e => e.id === selectedEventId ? { ...e, form_config: formConfig } : e));
                      setFormConfigStatus({ ok: true, msg: "Gespeichert." });
                    }}>
                      {formConfigSaving ? "Speichert…" : "Speichern"}
                    </BtnPrimary>
                  </div>
                </div>
              </Card>
            )}

            {/* CSV Import */}
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
              <CardHeader title="CSV-Import" subtitle={`Spalten: Name, Vorname, E-Mail${selectedEvent ? ` · ${selectedEvent.name}` : ''}`} />
              <div className="p-5 space-y-3">
                <input ref={csvInputRef} type="file" accept=".csv,text/csv"
                  onChange={e => { setCsvFile(e.target.files?.[0] || null); setCsvResult(null); setCsvSendResult(null); }}
                  className="hidden" />
                <BtnOutline onClick={() => csvInputRef.current?.click()} className="w-full">
                  <IconUpload className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{csvFile ? csvFile.name : "CSV-Datei wählen…"}</span>
                </BtnOutline>
                <div className="flex justify-end"><BtnPrimary onClick={handleCSVImport} disabled={!csvFile || csvImporting}>{csvImporting ? "Importiert…" : "Importieren"}</BtnPrimary></div>
                {csvResult && (
                  <div className="space-y-2">
                    <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: "var(--ig-light)", border: "1px solid var(--ig-gray2)" }}>
                      <p className="font-semibold" style={{ color: "var(--ig-navy)" }}>{csvResult.imported} Gäste importiert</p>
                      {csvResult.duplicates.length > 0 && (
                        <p style={{ color: "var(--ig-gold)" }}>{csvResult.duplicates.length} Duplikat(e) übersprungen</p>
                      )}
                      {csvResult.errors.length > 0 && (
                        <p className="text-red-500">{csvResult.errors.length} Fehler</p>
                      )}
                    </div>
                    {csvResult.imported > 0 && (
                      <div className="flex justify-end"><BtnPrimary onClick={handleSendQRToImported} disabled={csvSending}><IconMail className="w-3.5 h-3.5" />{csvSending ? "QR-Codes werden gesendet…" : `QR-Codes an ${csvResult.imported} Gäste senden`}</BtnPrimary></div>
                    )}
                    {csvSendResult && (
                      <p className={`text-xs ${csvSendResult.ok ? "text-green-600" : "text-red-500"}`}>{csvSendResult.msg}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* CSV Export */}
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
              <CardHeader title="CSV-Export" subtitle={event?.name ?? "Aktueller Event"} />
              <div className="p-5 space-y-2">
                {[
                  { type: "all", label: "Alle Registrierten", count: registrations.length },
                  { type: "checkedin", label: "Eingecheckt", count: checkedInCount },
                  { type: "noshows", label: "No-Shows", count: registrations.length - checkedInCount },
                ].map(({ type, label, count }) => (
                  <a key={type}
                    href={`/api/export?password=${encodeURIComponent(savedPassword.current)}&type=${type}${selectedEventId ? `&eventId=${selectedEventId}` : ''}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                    style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-black)", background: "white" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.background = "white"; }}
                  >
                    <div className="flex items-center gap-2">
                      <IconDownload className="w-4 h-4 flex-shrink-0" style={{ color: "var(--ig-navy)" }} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--ig-gray3)" }}>{count} Personen</span>
                  </a>
                ))}
              </div>
            </Card>

            {/* Alle Gäste löschen */}
            <Card>
              <div className="h-0.5" style={{ background: "#dc2626" }} />
              <CardHeader title="Gefahrenzone" />
              <div className="p-5">
                <p className="text-xs mb-4" style={{ color: "var(--ig-gray3)" }}>
                  Löscht sämtliche Registrierungen des aktuellen Events. Nicht rückgängig zu machen.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => showConfirm(
                      "Alle Gäste löschen",
                      `Wirklich alle ${registrations.length} Gäste löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                      true,
                      async () => {
                        const res = await fetch("/api/admin/clear", {
                          method: "DELETE", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ adminPassword: savedPassword.current, eventId: selectedEventId }),
                        });
                        await res.json();
                        setDialog(null);
                        if (res.ok) loadRegistrations(savedPassword.current, selectedEventId);
                      }
                    )}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ border: "1.5px solid #fecaca", color: "#dc2626", background: "#fff5f5" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fee2e2"; (e.currentTarget as HTMLElement).style.borderColor = "#dc2626"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff5f5"; (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; }}
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                    Alle {registrations.length} Gäste löschen
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}


        {/* ═══════════ ANALYTICS TAB ═══════════ */}
        {eventSection === "management" && activeTab === "analytics" && selectedEventId && (
          <AnalyticsDashboard eventId={selectedEventId} />
        )}

        {/* ═══════════ FORM-REGISTRATIONS TAB ═══════════ */}
        {eventSection === "management" && activeTab === "form-regs" && selectedEventId && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>
                {formRegs.length} Anmeldung{formRegs.length !== 1 ? "en" : ""}
                {selectedEvent?.max_capacity ? ` · Max. ${selectedEvent.max_capacity}` : ""}
              </p>
              <button
                onClick={() => { setFormRegsLoaded(false); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition"
                style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-gray3)", background: "white" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"; }}
              >
                <IconRefresh className="w-3.5 h-3.5" /> Aktualisieren
              </button>
            </div>
            {formRegsLoading ? (
              <div className="py-12 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Lädt…</div>
            ) : formRegs.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Noch keine Anmeldungen.</div>
            ) : (
              <div className="space-y-2">
                {formRegs.map(reg => (
                  <Card key={reg.id}>
                    <div className="px-5 py-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "var(--ig-navy)" }}>{reg.first_name} {reg.last_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>{reg.email}{reg.company ? ` · ${reg.company}` : ""}</p>
                        {reg.message && <p className="text-xs mt-1 italic" style={{ color: "var(--ig-gray3)" }}>{reg.message}</p>}
                        {reg.extra_fields && Object.entries(reg.extra_fields).filter(([k]) => k !== "company" && k !== "message").map(([, v]) => v ? (
                          <p key={v} className="text-xs mt-0.5 italic" style={{ color: "var(--ig-gray3)" }}>{v}</p>
                        ) : null)}
                        <p className="text-xs mt-1" style={{ color: "var(--ig-gray3)" }}>{new Date(reg.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <select
                        value={reg.status}
                        onChange={async e => {
                          const newStatus = e.target.value;
                          await fetch("/api/admin/form-registrations", {
                            method: "PATCH", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ adminPassword: savedPassword.current, id: reg.id, status: newStatus }),
                          });
                          setFormRegs(prev => prev.map(r => r.id === reg.id ? { ...r, status: newStatus as FormRegistration["status"] } : r));
                        }}
                        className="text-xs px-2 py-1 rounded-lg outline-none flex-shrink-0"
                        style={{
                          border: "1.5px solid var(--ig-gray2)",
                          color: reg.status === "confirmed" ? "#16a34a" : reg.status === "rejected" ? "#dc2626" : reg.status === "waitlisted" ? "#d97706" : "var(--ig-navy)",
                          background: reg.status === "confirmed" ? "#f0fdf4" : reg.status === "rejected" ? "#fff5f5" : reg.status === "waitlisted" ? "#fffbeb" : "white",
                        }}
                      >
                        <option value="pending">Ausstehend</option>
                        <option value="confirmed">Bestätigt</option>
                        <option value="rejected">Abgelehnt</option>
                        <option value="waitlisted">Warteliste</option>
                      </select>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ MAILING TAB ═══════════ */}
        {eventSection === "mailing" && (
          <div className="space-y-4">

            {/* ── Members / Zielgruppen ── */}
            {mailingTab === "members" && (
              <div className="space-y-4">

                {/* Zielgruppen Dashboard */}
                {membersLoading ? (
                  <div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div>
                ) : (
                  <ZielgruppenDashboard
                    zielgruppen={zielgruppen}
                    members={members as import("@/lib/supabase").Member[]}
                    eventId={selectedEventId!}
                    onMembersChange={updated => setMembers(updated as Member[])}
                    onZielgruppeChange={updated => setZielgruppen(updated)}
                  />
                )}

              </div>
            )}

            {/* ── Compose ── */}
            {mailingTab === "compose" && (
              <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
                <CampaignBuilder
                  key={editingCampaign?.id ?? "new"}
                  campaignId={editingCampaign?.id}
                  initialSubject={editingCampaign?.subject}
                  initialBlocks={(() => { const bj = editingCampaign?.blocks_json; if (!bj) return undefined; const p = typeof bj === 'string' ? JSON.parse(bj) : bj; if (Array.isArray(p)) return p as import("./CampaignBuilder").CampaignBlock[]; return (p as { blocks?: import("./CampaignBuilder").CampaignBlock[] }).blocks; })()}
                  initialLang={(() => { const bj = editingCampaign?.blocks_json; if (!bj) return undefined; const p = typeof bj === 'string' ? JSON.parse(bj) : bj; if (Array.isArray(p)) return undefined; return (p as { lang?: import("./i18n").Lang }).lang; })()}
                  initialTitle={(() => { const bj = editingCampaign?.blocks_json; if (!bj) return undefined; const p = typeof bj === 'string' ? JSON.parse(bj) : bj; if (Array.isArray(p)) return undefined; return (p as { title?: string }).title; })()}
                  initialEventUrl={editingCampaign?.event_url ?? undefined}
                  zielgruppeId={builderZielgruppeId}
                  onZielgruppeChange={setBuilderZielgruppeId}
                  zielgruppen={zielgruppen}
                  events={selectedEvent ? [{ id: selectedEvent.id, name: selectedEvent.name, date: selectedEvent.date }] : []}
                  onSaveDraft={async (subject, bodyHtml, eventUrl, blocks, zielgruppeId, autoId, isAutoSave, lang, title) => {
                    const blocksJson = { lang: lang ?? "en", title: title || "", blocks };
                    const existingId = autoId ?? editingCampaign?.id;
                    if (existingId) {
                      const res = await fetch(`/api/campaigns/${existingId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subject, body_html: bodyHtml, event_url: eventUrl || null, blocks_json: blocksJson, zielgruppe_id: zielgruppeId }),
                      });
                      const d = await res.json();
                      if (res.ok) setCampaigns(prev => prev.map(c => c.id === existingId ? d : c).concat(prev.find(c => c.id === existingId) ? [] : [d]));
                      if (!isAutoSave && editingCampaign) { setEditingCampaign(null); setTimeout(() => setMailingTab("drafts"), 300); }
                      return existingId;
                    } else {
                      const res = await fetch("/api/campaigns", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subject, body_html: bodyHtml, event_url: eventUrl || null, send_now: false, blocks_json: blocksJson, zielgruppe_id: zielgruppeId ?? null, event_id: selectedEventId }),
                      });
                      const d = await res.json();
                      if (res.ok) {
                        setCampaigns(prev => [d.campaign, ...prev]);
                        if (!isAutoSave) setTimeout(() => setMailingTab("drafts"), 800);
                        return d.campaign.id;
                      }
                      return "";
                    }
                  }}
                />
              </div>
            )}

            {/* ── Scheduled ── */}
            {mailingTab === "drafts" && (() => {
              const allDrafts = campaigns.filter(c => !c.sent_at && !c.scheduled_at);
              const drafts = draftsLang === "all" ? allDrafts : allDrafts.filter(c => {
                const bj = c.blocks_json as { lang?: string } | null;
                return bj && !Array.isArray(bj) ? bj.lang === draftsLang : draftsLang === "en";
              });
              return (
                <div className="space-y-3">
                  {/* Lang filter */}
                  {allDrafts.length > 0 && (
                    <div className="flex gap-2">
                      {(["all", "en", "de", "fr"] as const).map(l => (
                        <button key={l} onClick={() => setDraftsLang(l)}
                          className="px-3 py-1 rounded-full text-xs font-semibold transition"
                          style={{ background: draftsLang === l ? "var(--ig-navy)" : "#e5e7eb", color: draftsLang === l ? "white" : "var(--ig-navy)" }}>
                          {l === "all" ? "Alle" : l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                  {campaignsLoading ? (
                    <Card><div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div></Card>
                  ) : drafts.length === 0 ? (
                    <Card>
                      <div className="p-8 text-center space-y-3">
                        <p className="text-sm font-medium" style={{ color: "var(--ig-navy)" }}>Keine Entwürfe</p>
                        <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>Erstelle eine neue Kampagne und speichere sie als Entwurf</p>
                        <div className="flex justify-center">
                          <BtnPrimary onClick={() => setMailingTab("compose")}><IconPlus className="w-3.5 h-3.5" />Neue Kampagne</BtnPrimary>
                        </div>
                      </div>
                    </Card>
                  ) : drafts.map(c => (
                    <CampaignCard key={c.id} c={c}
                      zielgruppeName={zielgruppen.find(z => z.id === c.zielgruppe_id)?.name}
                      onSend={(id, sent) => setCampaigns(prev => prev.map(x => x.id === id ? { ...x, sent_at: new Date().toISOString(), recipient_count: sent } : x))}
                      onDelete={async (id) => { await fetch(`/api/campaigns/${id}`, { method: "DELETE" }); setCampaigns(prev => prev.filter(x => x.id !== id)); }}
                      onSchedule={(id, scheduled_at) => setCampaigns(prev => prev.map(x => x.id === id ? { ...x, scheduled_at } : x))}
                      onEdit={c.blocks_json ? () => { setEditingCampaign(c); setBuilderZielgruppeId(c.zielgruppe_id ?? null); setMailingTab("compose"); } : undefined}
                    />
                  ))}
                </div>
              );
            })()}

            {/* ── Campaign Archive (sent only) ── */}
            {mailingTab === "campaigns" && (() => {
              const sent = campaigns.filter(c => !!c.sent_at);
              return (
              <div className="space-y-3">
                {campaignsLoading ? (
                  <Card><div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div></Card>
                ) : sent.length === 0 ? (
                  <Card><div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Noch keine gesendeten Kampagnen.</div></Card>
                ) : sent.map(c => (
                  <CampaignCard key={c.id} c={c}
                    zielgruppeName={zielgruppen.find(z => z.id === c.zielgruppe_id)?.name}
                    onSend={(id, sent) => setCampaigns(prev => prev.map(x => x.id === id ? { ...x, sent_at: new Date().toISOString(), recipient_count: sent } : x))}
                    onDelete={async (id) => { await fetch(`/api/campaigns/${id}`, { method: "DELETE" }); setCampaigns(prev => prev.filter(x => x.id !== id)); }}
                    onSchedule={(id, scheduled_at) => { setCampaigns(prev => prev.map(x => x.id === id ? { ...x, scheduled_at } : x)); }}
                    onDuplicate={async () => {
                      const res = await fetch("/api/campaigns", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subject: `${c.subject} (Kopie)`, body_html: c.body_html, event_url: c.event_url || null, blocks_json: c.blocks_json || null, zielgruppe_id: c.zielgruppe_id || null, event_id: c.event_id, send_now: false }),
                      });
                      const d = await res.json();
                      if (res.ok) {
                        setCampaigns(prev => [d.campaign, ...prev]);
                        if (d.campaign.blocks_json) { setEditingCampaign(d.campaign); setBuilderZielgruppeId(d.campaign.zielgruppe_id ?? null); setMailingTab("compose"); }
                        else setMailingTab("drafts");
                      }
                    }}
                  />
                ))}
              </div>
              );
            })()}

          </div>
        )}

      </div>
      )}

      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          danger={dialog.danger}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* ── Scanner event picker (bottom sheet) ── */}
      {showScannerModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setShowScannerModal(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{ background: "white", maxHeight: "85svh", display: "flex", flexDirection: "column" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--ig-gray2)" }} />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 pt-2">
              <div>
                <p className="font-bold text-base" style={{ color: "var(--ig-navy)" }}>Scanner öffnen</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>Event auswählen</p>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--ig-light)", color: "var(--ig-gray3)" }}
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
            {/* Event list */}
            <div className="overflow-y-auto px-4 pb-8" style={{ flex: 1 }}>
              {(() => {
                const now = new Date();
                const scannerEvents = allEventCards
                  .filter(ev => ev.active && new Date(ev.date) >= now)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const pastActive = allEventCards
                  .filter(ev => ev.active && new Date(ev.date) < now)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const displayEvents = [...scannerEvents, ...pastActive];
                if (!displayEvents.length) return (
                  <p className="text-center py-8 text-sm" style={{ color: "var(--ig-gray3)" }}>Keine aktiven Events</p>
                );
                return displayEvents.map(ev => {
                  const isPast = new Date(ev.date) < now;
                  return (
                    <button
                      key={ev.id}
                      className="w-full text-left rounded-2xl mb-3 px-4 py-4 flex items-center gap-4 transition active:scale-[0.98]"
                      style={{ background: "var(--ig-light)", border: "1.5px solid var(--ig-gray2)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gold)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"}
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        setEventSection("management");
                        setActiveTab("scanner");
                        loadRegistrations(savedPassword.current, ev.id);
                        setShowScannerModal(false);
                      }}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "white", border: "1.5px solid var(--ig-gray2)" }}>
                        <IconCamera className="w-5 h-5" style={{ color: isPast ? "var(--ig-gray3)" : "var(--ig-navy)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--ig-navy)" }}>{ev.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: isPast ? "var(--ig-gray3)" : "var(--ig-gold)" }}>
                          {new Date(ev.date).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
                          {isPast && " · vergangen"}
                        </p>
                      </div>
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--ig-navy)" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
