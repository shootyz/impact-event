"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
      className={`py-3 rounded-xl font-semibold text-sm text-white tracking-widest uppercase transition disabled:opacity-40 ${className}`}
      style={{ background: hover && !disabled ? "#B8791F" : "var(--ig-gold)" }}
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
      className={`py-2 rounded-lg font-medium text-xs tracking-wide transition disabled:opacity-40 flex items-center justify-center gap-1.5 ${className}`}
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
type ArchivedEvent = { id: string; name: string; date: string; location: string; total: number; checked_in: number; };
type ScanResult = { status: "success" | "already_checked_in" | "error"; name?: string; message?: string; };
type ImportResult = { imported: number; duplicates: string[]; errors: string[]; } | null;

// ─── Campaign card (needs own state, can't use hooks inside .map) ──────────────
type CampaignType = { id: string; subject: string; body_html: string; header_image_url: string | null; event_url: string | null; sent_at: string | null; scheduled_at: string | null; recipient_count: number | null; created_at: string; };
function CampaignCard({ c, onSend, onDelete, onSchedule }: {
  c: CampaignType;
  onSend: (id: string, sent: number) => void;
  onDelete: (id: string) => void;
  onSchedule?: (id: string, scheduled_at: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");

  const statusText = c.sent_at
    ? `Gesendet am ${new Date(c.sent_at).toLocaleString("de-CH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${c.recipient_count ?? "–"} Empfänger`
    : c.scheduled_at
    ? `Geplant für ${new Date(c.scheduled_at).toLocaleString("de-CH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : "Entwurf – noch nicht gesendet";

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--ig-navy)" }}>{c.subject}</p>
            <p className="text-xs mt-0.5" style={{ color: c.scheduled_at && !c.sent_at ? "var(--ig-gold)" : "var(--ig-gray3)" }}>{statusText}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setExpanded(e => !e)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
              {expanded ? "Schliessen" : "Vorschau"}
            </button>
            {!c.sent_at && !confirmSend && !scheduling && (
              <>
                {onSchedule && (
                  <button onClick={() => { setScheduling(true); setScheduleValue(c.scheduled_at ? new Date(c.scheduled_at).toISOString().slice(0,16) : ""); }}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
                    {c.scheduled_at ? "Neu planen" : "Planen"}
                  </button>
                )}
                <button disabled={sending} onClick={() => setConfirmSend(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: "var(--ig-gold)", color: "#fff", border: "none" }}>
                  Jetzt senden
                </button>
              </>
            )}
            {!c.sent_at && confirmSend && (
              <div className="flex gap-1.5">
                <button onClick={async () => {
                  setConfirmSend(false); setSending(true);
                  const res = await fetch(`/api/campaigns/${c.id}`, { method: "POST" });
                  const d = await res.json();
                  setSending(false);
                  if (res.ok) { setSendResult(`✓ An ${d.sent} Mitglieder gesendet`); onSend(c.id, d.sent); }
                  else setSendResult(d.error || "Error");
                }} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: "#dc2626", color: "#fff", border: "none" }}>
                  {sending ? "Wird gesendet…" : "Bestätigen"}
                </button>
                <button onClick={() => setConfirmSend(false)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>
                  Abbrechen
                </button>
              </div>
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
            }} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: "var(--ig-navy)", color: "#fff", border: "none" }}>
              Speichern
            </button>
            {c.scheduled_at && (
              <button onClick={async () => {
                await fetch(`/api/campaigns/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduled_at: null }) });
                if (onSchedule) { onSchedule(c.id, null); setScheduling(false); }
              }} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--ig-light)", color: "#dc2626", border: "1.5px solid #dc2626" }}>
                Entfernen
              </button>
            )}
            <button onClick={() => setScheduling(false)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>
              Cancel
            </button>
          </div>
        )}
        {sendResult && <p className="text-xs mt-1 mb-2 font-medium" style={{ color: sendResult.startsWith("✓") ? "var(--ig-navy)" : "#dc2626" }}>{sendResult}</p>}
        {expanded && (
          <div style={{ border: "1.5px solid var(--ig-gray2)", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:20px;background:#F8F9FF;font-family:Arial,sans-serif;}</style></head><body>${c.body_html}</body></html>`}
              style={{ width: "100%", height: 520, border: "none", display: "block" }}
              title={c.subject}
            />
          </div>
        )}
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
  const [activeTab, setActiveTab] = useState<"scanner" | "list" | "tools" | "archiv" | "mailing">("list");

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

  const [eventPassword, setEventPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [currentEventPassword, setCurrentEventPassword] = useState<string | null>(undefined as unknown as null);

  const [archivedEvents, setArchivedEvents] = useState<ArchivedEvent[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  // Mailing state
  type Member = { id: string; first_name: string; last_name: string; email: string; unsubscribed: boolean; created_at: string; invite_codes?: { code: string; used: boolean }[] | { code: string; used: boolean } | null; };
  type Campaign = { id: string; subject: string; body_html: string; header_image_url: string | null; event_url: string | null; sent_at: string | null; scheduled_at: string | null; recipient_count: number | null; created_at: string; };
  const [mailingTab, setMailingTab] = useState<"members" | "compose" | "scheduled" | "campaigns">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [memberCsvFile, setMemberCsvFile] = useState<File | null>(null);
  const [memberCsvImporting, setMemberCsvImporting] = useState(false);
  const [memberCsvResult, setMemberCsvResult] = useState<{ inserted: number } | null>(null);
  const memberCsvRef = useRef<HTMLInputElement>(null);
  const [newMemberFirst, setNewMemberFirst] = useState("");
  const [newMemberLast, setNewMemberLast] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberLoading, setNewMemberLoading] = useState(false);
  const [newMemberError, setNewMemberError] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");
  const savedPassword = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<Record<string, AudioBuffer>>({});

  const loadRegistrations = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch(`/api/registrations?password=${encodeURIComponent(pw)}`);
    const data = await res.json();
    if (data.registrations) { setRegistrations(data.registrations); setEvent(data.event); }
    setLoading(false);
  }, []);

  const loadArchive = useCallback(async () => {
    if (archiveLoaded) return;
    setArchiveLoading(true);
    const res = await fetch(`/api/archive?password=${encodeURIComponent(savedPassword.current)}`);
    const data = await res.json();
    if (data.events) setArchivedEvents(data.events);
    setArchiveLoading(false);
    setArchiveLoaded(true);
  }, [archiveLoaded]);

  useEffect(() => {
    if (activeTab === "archiv") loadArchive();
    if (activeTab === "mailing" && !membersLoaded) {
      setMembersLoading(true);
      fetch("/api/members").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setMembers(d);
        setMembersLoading(false);
        setMembersLoaded(true);
      });
      setCampaignsLoading(true);
      fetch("/api/campaigns").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setCampaigns(d);
        setCampaignsLoading(false);
      });
    }
    if (activeTab === "tools") {
      fetch(`/api/admin/event?password=${encodeURIComponent(savedPassword.current)}`)
        .then(r => r.json()).then(d => setCurrentEventPassword(d.registration_password ?? null));
    }
  }, [activeTab, loadArchive]);

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
    import("jsqr").then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
        setTimeout(() => { lastScanRef.current = ""; }, 4000);
      }
    });
    rafRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = useCallback(async () => {
    await unlockAndLoadAudio();
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
      body: JSON.stringify({ adminPassword: savedPassword.current, name: `${manualVorname.trim()} ${manualNachname.trim()}`, email: manualEmail }),
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
    const res = await fetch("/api/admin/import", { method: "POST", body: fd });
    const data = await res.json();
    setCsvImporting(false);
    if (!res.ok) { setCsvResult({ imported: 0, duplicates: [], errors: [data.error] }); }
    else { setCsvResult(data); if (data.imported > 0) loadRegistrations(savedPassword.current); }
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

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null); setPwLoading(true);
    const res = await fetch("/api/admin/event", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: savedPassword.current, registration_password: eventPassword || null }),
    });
    setPwLoading(false);
    if (!res.ok) { setPwStatus({ ok: false, msg: "Fehler beim Speichern." }); }
    else {
      setCurrentEventPassword(eventPassword || null);
      setPwStatus({ ok: true, msg: eventPassword ? `Passwort gesetzt: „${eventPassword}"` : "Passwortschutz entfernt." });
      setEventPassword("");
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
                <BtnPrimary type="submit" className="w-full">Anmelden</BtnPrimary>
              </form>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // ─── MAIN ADMIN ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: "scanner", label: "Scanner" },
    { id: "list", label: "Gäste" },
    { id: "tools", label: "Tools" },
    { id: "archiv", label: "Archiv" },
    { id: "mailing", label: "Mailing" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ig-light)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Impact Gstaad" className="h-7 object-contain" />
            {event && (
              <>
                <div className="w-px h-5 hidden sm:block" style={{ background: "var(--ig-gray2)" }} />
                <span className="text-sm font-medium hidden sm:block truncate max-w-xs" style={{ color: "var(--ig-gray3)" }}>{event.name}</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (activeTab === "mailing") {
                setMembersLoaded(false);
                setMembersLoading(true);
                fetch("/api/members").then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d); setMembersLoading(false); setMembersLoaded(true); });
                setCampaignsLoading(true);
                fetch("/api/campaigns").then(r => r.json()).then(d => { if (Array.isArray(d)) setCampaigns(d); setCampaignsLoading(false); });
              } else {
                loadRegistrations(savedPassword.current);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
            style={{ color: "var(--ig-gray3)", border: "1px solid var(--ig-gray2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; }}
          >
            <IconRefresh className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">

        {/* ── Tabs ── */}
        <div className="flex border-b mb-6" style={{ borderColor: "var(--ig-gray2)" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3.5 text-sm font-semibold tracking-wide transition relative"
              style={{ color: activeTab === tab.id ? "var(--ig-gold)" : "var(--ig-navy)", fontWeight: 700 }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--ig-gold)" }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Filter Pills ── */}
        {activeTab === "list" && (
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
        {activeTab === "scanner" && (
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
        {activeTab === "list" && (
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
                    <BtnPrimary type="submit" disabled={manualLoading} className="w-full">
                      {manualLoading ? "Wird gespeichert…" : "Speichern"}
                    </BtnPrimary>
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
        {activeTab === "tools" && (
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 items-start">

            {/* Anmeldeseite sperren */}
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
              <CardHeader title="Anmeldeseite sperren" subtitle="Mitglieder brauchen diesen Code um sich anzumelden." />
              <div className="p-5">
                {currentEventPassword !== (undefined as unknown as null) && (
                  <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: currentEventPassword ? "rgba(210,141,40,0.08)" : "var(--ig-light)", border: `1px solid ${currentEventPassword ? "rgba(210,141,40,0.2)" : "var(--ig-gray2)"}` }}>
                    <IconLock className="w-4 h-4 flex-shrink-0" style={{ color: currentEventPassword ? "var(--ig-gold)" : "var(--ig-gray3)" } } />
                    <div>
                      <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>Aktueller Code</p>
                      <p className="text-sm font-semibold font-mono" style={{ color: currentEventPassword ? "var(--ig-gold)" : "var(--ig-gray3)" }}>
                        {currentEventPassword ?? "Kein Schutz aktiv"}
                      </p>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSetPassword} className="space-y-3">
                  <input type="text" value={eventPassword} onChange={e => setEventPassword(e.target.value)}
                    placeholder="Neuer Einladungscode (leer = kein Schutz)"
                    className={inputClass} style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                  {pwStatus && (
                    <p className={`text-xs ${pwStatus.ok ? "text-green-600" : "text-red-500"}`}>{pwStatus.msg}</p>
                  )}
                  <BtnPrimary type="submit" disabled={pwLoading} className="w-full">
                    {pwLoading ? "Speichert…" : "Speichern"}
                  </BtnPrimary>
                </form>
              </div>
            </Card>

            {/* CSV Import */}
            <Card>
              <div className="h-0.5" style={{ background: "var(--ig-gold)" }} />
              <CardHeader title="CSV-Import" subtitle="Spalten: Name, Vorname, E-Mail" />
              <div className="p-5 space-y-3">
                <label className="block cursor-pointer mb-3">
                  <input ref={csvInputRef} type="file" accept=".csv,text/csv"
                    onChange={e => { setCsvFile(e.target.files?.[0] || null); setCsvResult(null); setCsvSendResult(null); }}
                    className="hidden" />
                  <div className="w-full px-4 py-3 rounded-xl text-sm text-center transition flex items-center justify-center gap-2 cursor-pointer border"
                    style={{ borderColor: "var(--ig-navy)", color: "var(--ig-navy)", background: "var(--ig-light)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; (e.currentTarget as HTMLElement).style.color = "var(--ig-navy)"; }}>
                    <IconUpload className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{csvFile ? csvFile.name : "CSV-Datei wählen…"}</span>
                  </div>
                </label>
                <BtnPrimary onClick={handleCSVImport} disabled={!csvFile || csvImporting} className="w-full">
                  {csvImporting ? "Importiert…" : "Importieren"}
                </BtnPrimary>
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
                      <BtnPrimary onClick={handleSendQRToImported} disabled={csvSending} className="w-full">
                        <IconMail className="w-4 h-4" />
                        {csvSending ? "QR-Codes werden gesendet…" : `QR-Codes an ${csvResult.imported} Gäste senden`}
                      </BtnPrimary>
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
              <CardHeader title="CSV-Export" subtitle="Aktueller Event" />
              <div className="p-5 space-y-2">
                {[
                  { type: "all", label: "Alle Registrierten", count: registrations.length },
                  { type: "checkedin", label: "Eingecheckt", count: checkedInCount },
                  { type: "noshows", label: "No-Shows", count: registrations.length - checkedInCount },
                ].map(({ type, label, count }) => (
                  <a key={type}
                    href={`/api/export?password=${encodeURIComponent(savedPassword.current)}&type=${type}`}
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
                <button
                  onClick={() => showConfirm(
                    "Alle Gäste löschen",
                    `Wirklich alle ${registrations.length} Gäste löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                    true,
                    async () => {
                      const res = await fetch("/api/admin/clear", {
                        method: "DELETE", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminPassword: savedPassword.current }),
                      });
                      const data = await res.json();
                      setDialog(null);
                      if (res.ok) loadRegistrations(savedPassword.current);
                    }
                  )}
                  className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition"
                  style={{ border: "1.5px solid #fecaca", color: "#dc2626", background: "#fff5f5" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fee2e2"; (e.currentTarget as HTMLElement).style.borderColor = "#dc2626"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff5f5"; (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; }}
                >
                  <IconTrash className="w-4 h-4" />
                  Alle {registrations.length} Gäste löschen
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════ ARCHIV TAB ═══════════ */}
        {activeTab === "archiv" && (
          <div className="space-y-4">
            {archiveLoading ? (
              <Card><div className="p-10 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Lädt…</div></Card>
            ) : archivedEvents.length === 0 ? (
              <Card><div className="p-10 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Noch keine archivierten Events.</div></Card>
            ) : (
              <div className="sm:grid sm:grid-cols-2 sm:gap-4 space-y-4 sm:space-y-0">
                {archivedEvents.map(ev => (
                  <Card key={ev.id}>
                    <div className="h-0.5" style={{ background: `linear-gradient(90deg, var(--ig-navy), var(--ig-gold))` }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--ig-navy)" }}>{ev.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--ig-gray3)" }}>
                            {new Date(ev.date).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>{ev.location}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg" style={{ color: "var(--ig-gold)" }}>{ev.checked_in}</p>
                          <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>von {ev.total}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { type: "all", label: "Alle" },
                          { type: "checkedin", label: "Eingecheckt" },
                          { type: "noshows", label: "No-Shows" },
                        ].map(({ type, label }) => (
                          <a key={type}
                            href={`/api/export?password=${encodeURIComponent(savedPassword.current)}&type=${type}&eventId=${ev.id}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 text-center py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
                            style={{ border: "1px solid var(--ig-gray2)", color: "var(--ig-navy)", background: "var(--ig-light)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-navy)"; (e.currentTarget as HTMLElement).style.background = "white"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ig-gray2)"; (e.currentTarget as HTMLElement).style.background = "var(--ig-light)"; }}
                          >
                            <IconDownload className="w-3 h-3" />{label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ MAILING TAB ═══════════ */}
        {activeTab === "mailing" && (
          <div className="space-y-4">

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-2">
              {(["members", "compose", "scheduled", "campaigns"] as const).map(t => (
                <button key={t} onClick={() => setMailingTab(t)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition capitalize"
                  style={{
                    background: mailingTab === t ? "var(--ig-navy)" : "white",
                    color: mailingTab === t ? "white" : "var(--ig-navy)",
                    border: "1.5px solid var(--ig-gray2)",
                  }}>
                  {t === "members" ? "Mitglieder" : t === "compose" ? "Neue Kampagne" : t === "scheduled" ? "Geplant" : "Archiv"}
                </button>
              ))}
            </div>

            {/* ── Members ── */}
            {mailingTab === "members" && (
              <div className="space-y-4">

                {/* Add single member */}
                <Card>
                  <CardHeader title="Mitglied hinzufügen" />
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputClass} style={inputStyle} placeholder="Vorname" value={newMemberFirst}
                        onChange={e => setNewMemberFirst(e.target.value)}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                      <input className={inputClass} style={inputStyle} placeholder="Nachname" value={newMemberLast}
                        onChange={e => setNewMemberLast(e.target.value)}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                    </div>
                    <input className={inputClass} style={inputStyle} placeholder="Email" value={newMemberEmail} type="email"
                      onChange={e => setNewMemberEmail(e.target.value)}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                    {newMemberError && <p className="text-xs text-red-500">{newMemberError}</p>}
                    <BtnPrimary className="w-full" disabled={newMemberLoading}
                      onClick={async () => {
                        if (!newMemberFirst.trim() || !newMemberLast.trim() || !newMemberEmail.trim()) {
                          setNewMemberError("Alle Felder sind erforderlich."); return;
                        }
                        setNewMemberError("");
                        setNewMemberLoading(true);
                        const res = await fetch("/api/members", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ members: [{ first_name: newMemberFirst, last_name: newMemberLast, email: newMemberEmail }] }),
                        });
                        const d = await res.json();
                        setNewMemberLoading(false);
                        if (!res.ok) { setNewMemberError(d.error || "Fehler"); return; }
                        setNewMemberFirst(""); setNewMemberLast(""); setNewMemberEmail("");
                        fetch("/api/members").then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d); });
                      }}>
                      {newMemberLoading ? "Wird hinzugefügt…" : "Mitglied hinzufügen"}
                    </BtnPrimary>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Mitglieder importieren" subtitle="CSV mit Spalten: first_name, last_name, email" />
                  <div className="p-5 space-y-3">
                    <input ref={memberCsvRef} type="file" accept=".csv" className="hidden"
                      onChange={e => setMemberCsvFile(e.target.files?.[0] ?? null)} />
                    <div className="flex gap-3">
                      <BtnOutline onClick={() => memberCsvRef.current?.click()} className="flex-1">
                        <IconUpload />
                        {memberCsvFile ? memberCsvFile.name : "CSV auswählen"}
                      </BtnOutline>
                      <BtnPrimary className="flex-1 px-4" disabled={!memberCsvFile || memberCsvImporting}
                        onClick={async () => {
                          if (!memberCsvFile) return;
                          setMemberCsvImporting(true);
                          setMemberCsvResult(null);
                          const text = await memberCsvFile.text();
                          const lines = text.trim().split("\n");
                          const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
                          const iFirst = headers.indexOf("first_name");
                          const iLast = headers.indexOf("last_name");
                          const iEmail = headers.indexOf("email");
                          if (iFirst < 0 || iLast < 0 || iEmail < 0) {
                            setMemberCsvResult({ inserted: -1 });
                            setMemberCsvImporting(false);
                            return;
                          }
                          const rows = lines.slice(1).map(l => {
                            const cols = l.split(",").map(c => c.trim().replace(/"/g, ""));
                            return { first_name: cols[iFirst], last_name: cols[iLast], email: cols[iEmail] };
                          }).filter(r => r.email);
                          const res = await fetch("/api/members", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ members: rows }),
                          });
                          const d = await res.json();
                          setMemberCsvResult(d);
                          setMemberCsvImporting(false);
                          setMembersLoaded(false);
                          // reload
                          fetch("/api/members").then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d); setMembersLoaded(true); });
                        }}>
                        {memberCsvImporting ? "Importiert…" : "Importieren"}
                      </BtnPrimary>
                    </div>
                    {memberCsvResult && (
                      <p className="text-sm" style={{ color: memberCsvResult.inserted < 0 ? "#dc2626" : "var(--ig-navy)" }}>
                        {memberCsvResult.inserted < 0 ? "CSV muss Spalten haben: first_name, last_name, email" : `${memberCsvResult.inserted} Mitglieder importiert/aktualisiert.`}
                      </p>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title={`Mitglieder (${members.filter(m => !m.unsubscribed).length} aktiv)`} />
                  <div className="divide-y" style={{ borderColor: "var(--ig-gray2)" }}>
                    {membersLoading ? (
                      <div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div>
                    ) : members.length === 0 ? (
                      <div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Noch keine Mitglieder.</div>
                    ) : members.map(m => (
                      <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: m.unsubscribed ? "var(--ig-gray3)" : "var(--ig-navy)" }}>
                            {m.first_name} {m.last_name}
                            {m.unsubscribed && <span className="ml-2 text-xs" style={{ color: "var(--ig-gray3)" }}>(abgemeldet)</span>}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--ig-gray3)" }}>{m.email}</p>
                        </div>
                        {(() => {
                          const ic = Array.isArray(m.invite_codes) ? m.invite_codes[0] : m.invite_codes;
                          return ic?.code ? (
                            <span className="flex-shrink-0 text-xs font-mono font-bold px-2 py-1 rounded-lg" style={{ background: ic.used ? "var(--ig-gray2)" : "#F8F9FF", color: ic.used ? "var(--ig-gray3)" : "var(--ig-gold)", border: "1px solid var(--ig-gray2)", letterSpacing: "0.1em", textDecoration: ic.used ? "line-through" : "none" }}>
                              {ic.code}
                            </span>
                          ) : null;
                        })()}
                        <button onClick={async () => {
                          await fetch("/api/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id }) });
                          setMembers(prev => prev.filter(x => x.id !== m.id));
                        }} className="flex-shrink-0 p-1.5 rounded-lg transition" style={{ color: "var(--ig-gray3)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── Compose ── */}
            {mailingTab === "compose" && (
              <Card>
                <CardHeader title="Neue Kampagne" subtitle="An alle aktiven Mitglieder senden" />
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--ig-navy)" }}>Betreff *</label>
                    <input className={inputClass} style={inputStyle} value={campaignSubject}
                      onChange={e => setCampaignSubject(e.target.value)} placeholder="Impact Circle Event – Invitation"
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--ig-navy)" }}>Header-Bild <span style={{ color: "var(--ig-gray3)", fontWeight: 400 }}>(optional)</span></label>
                    <input ref={headerImageRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setHeaderUploading(true);
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      const d = await res.json();
                      if (d.url) setCampaignHeaderUrl(d.url);
                      setHeaderUploading(false);
                    }} />
                    <div className="flex gap-3 items-center">
                      <BtnOutline onClick={() => headerImageRef.current?.click()} className="flex-1" disabled={headerUploading}>
                        <IconUpload />
                        {headerUploading ? "Wird hochgeladen…" : campaignHeaderUrl ? "Bild ersetzen" : "Bild hochladen"}
                      </BtnOutline>
                      {campaignHeaderUrl && (
                        <button onClick={() => setCampaignHeaderUrl("")} className="text-xs px-3 py-2 rounded-lg transition" style={{ color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ig-gray3)"}>
                          Entfernen
                        </button>
                      )}
                    </div>
                    {campaignHeaderUrl && (
                      <img src={campaignHeaderUrl} alt="Header-Vorschau" className="mt-3 rounded-xl w-full object-cover" style={{ maxHeight: 120 }} />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--ig-navy)" }}>Inhalt (HTML) *</label>
                    <textarea className={inputClass} style={{ ...inputStyle, minHeight: 200, resize: "vertical", fontSize: 14, lineHeight: "1.6" }}
                      value={campaignBody} onChange={e => setCampaignBody(e.target.value)}
                      placeholder={"We are pleased to invite you to the next Impact Circle Event.\n\nThe evening will bring together…"}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                    <p className="text-xs mt-1" style={{ color: "var(--ig-gray3)" }}>Fliesstext — Leerzeilen erzeugen neue Absätze. Die Anrede wird automatisch hinzugefügt.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--ig-navy)" }}>Anmelde-Button URL <span style={{ color: "var(--ig-gray3)", fontWeight: 400 }}>(optional)</span></label>
                    <input className={inputClass} style={inputStyle} value={campaignEventUrl}
                      onChange={e => setCampaignEventUrl(e.target.value)} placeholder={typeof window !== "undefined" ? window.location.origin : "https://…"}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--ig-navy)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--ig-gray2)"} />
                  </div>
                  {campaignResult && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: campaignResult.ok ? "#f0fdf4" : "#fef2f2", color: campaignResult.ok ? "#16a34a" : "#dc2626", border: `1px solid ${campaignResult.ok ? "#bbf7d0" : "#fecaca"}` }}>
                      {campaignResult.msg}
                    </div>
                  )}
                  <div className="flex gap-3">
                  <BtnOutline className="flex-1" disabled={!campaignSubject.trim() || !campaignBody.trim() || campaignSending}
                    onClick={async () => {
                      setCampaignSending(true);
                      setCampaignResult(null);
                      const res = await fetch("/api/campaigns", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          subject: campaignSubject,
                          header_image_url: campaignHeaderUrl || null,
                          body_html: campaignBody,
                          event_url: campaignEventUrl || null,
                          send_now: false,
                        }),
                      });
                      const d = await res.json();
                      setCampaignSending(false);
                      if (!res.ok) {
                        setCampaignResult({ ok: false, msg: d.error || "Fehler." });
                      } else {
                        setCampaignResult({ ok: true, msg: "Als Entwurf gespeichert." });
                        setCampaignSubject(""); setCampaignBody(""); setCampaignHeaderUrl(""); setCampaignEventUrl("");
                        setCampaigns(prev => [d.campaign, ...prev]);
                        setTimeout(() => setMailingTab("campaigns"), 800);
                      }
                    }}>
                    Als Entwurf speichern
                  </BtnOutline>
                  <BtnPrimary className="flex-1" disabled={!campaignSubject.trim() || !campaignBody.trim() || campaignSending}
                    onClick={async () => {
                      setCampaignSending(true);
                      setCampaignResult(null);
                      const res = await fetch("/api/campaigns", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          subject: campaignSubject,
                          header_image_url: campaignHeaderUrl || null,
                          body_html: campaignBody,
                          event_url: campaignEventUrl || null,
                          send_now: true,
                        }),
                      });
                      const d = await res.json();
                      setCampaignSending(false);
                      if (!res.ok) {
                        setCampaignResult({ ok: false, msg: d.error || "Fehler beim Senden." });
                      } else {
                        setCampaignResult({ ok: true, msg: `An ${d.sent} Empfänger gesendet.` });
                        setCampaignSubject(""); setCampaignBody(""); setCampaignHeaderUrl(""); setCampaignEventUrl("");
                        setCampaigns(prev => [d.campaign, ...prev]);
                      }
                    }}>
                    {campaignSending ? `Wird an ${members.filter(m => !m.unsubscribed).length} Mitglieder gesendet…` : "Kampagne senden"}
                  </BtnPrimary>
                </div>
              </Card>
            )}

            {/* ── Scheduled ── */}
            {mailingTab === "scheduled" && (() => {
              const scheduled = campaigns.filter(c => c.scheduled_at && !c.sent_at);
              return (
                <div className="space-y-3">
                  {campaignsLoading ? (
                    <Card><div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div></Card>
                  ) : scheduled.length === 0 ? (
                    <Card>
                      <div className="p-8 text-center">
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--ig-navy)" }}>Keine geplanten Kampagnen</p>
                        <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>Im Archiv einen Entwurf öffnen und «Planen» klicken</p>
                      </div>
                    </Card>
                  ) : scheduled.map(c => (
                    <CampaignCard key={c.id} c={c}
                      onSend={(id, sent) => setCampaigns(prev => prev.map(x => x.id === id ? { ...x, sent_at: new Date().toISOString(), recipient_count: sent } : x))}
                      onDelete={async (id) => { await fetch(`/api/campaigns/${id}`, { method: "DELETE" }); setCampaigns(prev => prev.filter(x => x.id !== id)); }}
                      onSchedule={(id, scheduled_at) => setCampaigns(prev => prev.map(x => x.id === id ? { ...x, scheduled_at } : x))}
                    />
                  ))}
                </div>
              );
            })()}

            {/* ── Campaign Archive ── */}
            {mailingTab === "campaigns" && (
              <div className="space-y-3">
                {campaignsLoading ? (
                  <Card><div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Wird geladen…</div></Card>
                ) : campaigns.length === 0 ? (
                  <Card><div className="p-8 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Noch keine Kampagnen.</div></Card>
                ) : campaigns.map(c => (
                  <CampaignCard key={c.id} c={c}
                    onSend={(id, sent) => setCampaigns(prev => prev.map(x => x.id === id ? { ...x, sent_at: new Date().toISOString(), recipient_count: sent } : x))}
                    onDelete={async (id) => { await fetch(`/api/campaigns/${id}`, { method: "DELETE" }); setCampaigns(prev => prev.filter(x => x.id !== id)); }}
                    onSchedule={(id, scheduled_at) => { setCampaigns(prev => prev.map(x => x.id === id ? { ...x, scheduled_at } : x)); if (scheduled_at) setMailingTab("scheduled"); }}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          danger={dialog.danger}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
