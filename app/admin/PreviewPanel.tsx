"use client";

import { useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import type {
  CampaignBlock, IntroBlock, EventDetailsBlock, ProgramBlock,
  FinalistsBlock, SpeakerBlock, TextBlock, InfoBlock, DeadlineBlock, RegisterButtonBlock,
} from "./CampaignBuilder";
import { type Lang, T, DATE_LOCALE } from "./i18n";

import { D } from "./email-design";

// ── Editable primitive ────────────────────────────────────────────────────────

function Editable({ value, onChange, placeholder, style, className, multiline = false }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (ref.current && !focused.current) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { focused.current = true; }}
      onBlur={e => {
        focused.current = false;
        onChange(e.currentTarget.textContent || "");
      }}
      onKeyDown={e => {
        if (e.key === "Enter" && !multiline) { e.preventDefault(); (e.target as HTMLElement).blur(); }
        if (e.key === "Enter" && e.altKey) { e.preventDefault(); (e.target as HTMLElement).blur(); }
      }}
      data-placeholder={placeholder}
      className={className}
      style={{
        outline: "none",
        cursor: "text",
        minWidth: 40,
        borderRadius: 4,
        padding: "1px 3px",
        margin: "-1px -3px",
        transition: "background 0.15s",
        ...style,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(210,141,40,0.08)"; }}
      onMouseLeave={e => { if (!focused.current) (e.currentTarget as HTMLElement).style.background = ""; }}
      onFocusCapture={e => { (e.currentTarget as HTMLElement).style.background = "rgba(210,141,40,0.12)"; }}
      onBlurCapture={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
    />
  );
}

// ── Block preview renderers ───────────────────────────────────────────────────

function RichPreview({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: true, autolink: true })],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  if (!editor) return null;
  const isEmpty = !value || value === "<p></p>";
  return (
    <>
      <style>{`
        .rp-wrap .tiptap{outline:none;cursor:text;}
        .rp-wrap .tiptap p{margin:0 0 10px;font-size:15px;line-height:1.75;color:${D.black};}
        .rp-wrap .tiptap p:last-child{margin-bottom:0;}
        .rp-wrap .tiptap ul{list-style-type:disc;padding-left:20px;margin:0 0 10px;font-size:15px;line-height:1.75;color:${D.black};}
        .rp-wrap .tiptap ol{list-style-type:decimal;padding-left:20px;margin:0 0 10px;font-size:15px;}
        .rp-wrap .tiptap li{margin-bottom:3px;}
        .rp-wrap .tiptap a{color:#D28D28;text-decoration:underline;}
        .rp-wrap .tiptap p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none;float:left;height:0;}
      `}</style>
      <div className="rp-wrap" style={{ borderRadius: 4, transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(210,141,40,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background = "")}>
        {isEmpty && !editor.isFocused && (
          <p style={{ color: "#9ca3af", fontSize: 14, margin: 0, cursor: "text" }} onClick={() => editor.commands.focus()}>{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </>
  );
}

function IntroPreview({ block, onChange }: { block: IntroBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  return <RichPreview value={block.text} onChange={v => onChange({ ...block, text: v })} placeholder="Intro-Text eingeben…" />;
}

function EventDetailsPreview({ block, onChange, subject, lang = "en" }: { block: EventDetailsBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void; subject?: string; lang?: Lang }) {
  const tl = T[lang];
  const field = (label: string, value: string, key: keyof EventDetailsBlock) => (
    <div style={{ padding: "10px 0" }}>
      <p style={{ color: D.navy, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
      <Editable value={value} onChange={v => onChange({ ...block, [key]: v })}
        placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} />
    </div>
  );

  function downloadIcs() {
    if (!block.date) return;
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(block.date)
      ? block.date
      : (() => { const d = new Date(block.date); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); })();
    if (!isoDate) return;
    const timeStr = block.time || "13:00";
    const start = new Date(`${isoDate}T${timeStr}:00`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (dt: Date) => `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
    const location = [block.venue_name, block.venue_address].filter(Boolean).join(", ");
    const icsTitle = [block.category, block.event_title].filter(Boolean).join(": ") || subject || "Impact Gstaad Event";
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Impact Gstaad//EN","BEGIN:VEVENT",
      `UID:${isoDate}-${Date.now()}@impactgstaad.ch`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
      `SUMMARY:${icsTitle}`,location ? `LOCATION:${location}` : "",
      "END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(subject || "event").replace(/\s+/g, "-").toLowerCase()}.ics`; a.click();
    URL.revokeObjectURL(url);
  }

  const formattedDate = block.date ? (() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(block.date)) {
      try { return new Date(block.date + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang ?? "en"], { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch { return block.date; }
    }
    return block.date;
  })() + (block.time ? `, ${block.time}` : "") : null;

  const rows: { label: string; content: React.ReactNode }[] = [];
  if (formattedDate) rows.push({ label: tl.date, content: <span style={{ color: D.black, fontSize: 15, fontWeight: 400 }}>{formattedDate}</span> });
  else if (block.time) rows.push({ label: tl.time, content: <Editable value={block.time} onChange={v => onChange({ ...block, time: v })} placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} /> });
  if (block.venue_name !== undefined) rows.push({ label: tl.venue, content: <Editable value={block.venue_name} onChange={v => onChange({ ...block, venue_name: v })} placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} /> });
  if (block.venue_address !== undefined) rows.push({ label: tl.address, content: <Editable value={block.venue_address} onChange={v => onChange({ ...block, venue_address: v })} placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} /> });
  if (block.moderation_name) rows.push({ label: tl.moderation, content: <Editable value={block.moderation_name} onChange={v => onChange({ ...block, moderation_name: v })} placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} /> });
  if (block.moderation_title) rows.push({ label: tl.moderation + " Title", content: <Editable value={block.moderation_title} onChange={v => onChange({ ...block, moderation_title: v })} placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} /> });
  if (block.date) rows.push({ label: "", content: (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <button onClick={downloadIcs}
        style={{ display: "flex", alignItems: "center", gap: 6, color: D.gold, fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {tl.addToCalendar}
      </button>
      {block.venue_address && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.venue_address)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, color: D.gold, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          Maps
        </a>
      )}
    </div>
  ) });

  return (
    <div>
      {block.category && (
        <p style={{ color: D.gold, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>{block.category}</p>
      )}
      {block.event_title && (
        <p style={{ color: D.navy, fontSize: 16, fontWeight: 700, margin: "0 0 14px" }}>{block.event_title}</p>
      )}
      <div style={{ borderTop: `1px solid ${D.gray2}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        {formattedDate && <span style={{ color: D.black, fontSize: 14 }}>{formattedDate}</span>}
        {!block.date && block.time && <Editable value={block.time} onChange={v => onChange({ ...block, time: v })} placeholder="—" style={{ color: D.black, fontSize: 14 }} />}
        {block.venue_name !== undefined && <Editable value={block.venue_name} onChange={v => onChange({ ...block, venue_name: v })} placeholder="Venue" style={{ color: D.black, fontSize: 14 }} />}
        {block.venue_address !== undefined && <Editable value={block.venue_address} onChange={v => onChange({ ...block, venue_address: v })} placeholder="Adresse" style={{ color: D.gray, fontSize: 13 }} />}
        {block.moderation_name && (
          <div style={{ marginTop: 2 }}>
            <p style={{ color: D.gray, fontSize: 11, margin: "0 0 2px", letterSpacing: 1 }}>{tl.moderation}</p>
            <Editable value={block.moderation_name} onChange={v => onChange({ ...block, moderation_name: v })} placeholder="Name" style={{ color: D.black, fontSize: 14 }} />
            {block.moderation_title && <Editable value={block.moderation_title} onChange={v => onChange({ ...block, moderation_title: v })} placeholder="Titel" style={{ color: D.gray, fontSize: 13 }} />}
          </div>
        )}
      </div>
      {(block.date || block.venue_address) && (
        <div style={{ borderTop: `1px solid ${D.gray2}`, marginTop: 14, paddingTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
          {block.date && (
            <button onClick={downloadIcs}
              style={{ color: D.gold, fontSize: 13, fontWeight: 400, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "none", letterSpacing: 0.2 }}>
              {tl.addToCalendar}
            </button>
          )}
          {block.date && block.venue_address && (
            <span style={{ color: D.gray2, fontSize: 13, margin: "0 8px" }}>·</span>
          )}
          {block.venue_address && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.venue_address)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: D.gold, fontSize: 13, fontWeight: 400, textDecoration: "underline", letterSpacing: 0.2 }}>
              Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramPreview({ block, onChange }: { block: ProgramBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  const updateSlot = (id: string, patch: Partial<typeof block.slots[0]>) =>
    onChange({ ...block, slots: block.slots.map(s => s.id === id ? { ...s, ...patch } : s) });

  return (
    <div>
      {block.slots.map((slot, si) => (
        <div key={slot.id} style={{ padding: "14px 0", borderBottom: si < block.slots.length - 1 ? `1px solid ${D.gray2}` : "none" }}>
          <Editable value={slot.time} onChange={v => updateSlot(slot.id, { time: v })}
            placeholder="Zeit" style={{ color: D.navy, fontSize: 12, fontWeight: 700, marginBottom: 4 }} />
          <Editable value={slot.title} onChange={v => updateSlot(slot.id, { title: v })}
            placeholder="Titel" style={{ color: D.black, fontSize: 15, fontWeight: 400 }} />
          {slot.sub_items.map((sub, i) => (
            <div key={sub.id} style={{ marginTop: 8, paddingLeft: 12, borderLeft: `3px solid ${D.gold}` }}>
              <Editable value={sub.title} onChange={v => {
                const sub_items = slot.sub_items.map((s, j) => j === i ? { ...s, title: v } : s);
                updateSlot(slot.id, { sub_items });
              }} placeholder="Sub-Titel" style={{ color: D.black, fontSize: 14, fontWeight: 600 }} />
              {sub.speaker !== undefined && (
                <Editable value={sub.speaker ?? ""} onChange={v => {
                  const sub_items = slot.sub_items.map((s, j) => j === i ? { ...s, speaker: v } : s);
                  updateSlot(slot.id, { sub_items });
                }} placeholder="Speaker" style={{ color: D.gray, fontSize: 13 }} />
              )}
            </div>
          ))}
          {slot.note !== undefined && (
            <Editable value={slot.note ?? ""} onChange={v => updateSlot(slot.id, { note: v })}
              placeholder="Hinweis…" multiline
              style={{ color: D.gray, fontSize: 13, marginTop: 8, display: "block" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function FinalistsPreview({ block, onChange }: { block: FinalistsBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  return (
    <div>
      <Editable value={block.title} onChange={v => onChange({ ...block, title: v })}
        placeholder="Award Title" style={{ color: D.navy, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }} />
      {block.intro && (
        <Editable value={block.intro} onChange={v => onChange({ ...block, intro: v })}
          placeholder="Intro…" multiline style={{ color: D.black, fontSize: 15, lineHeight: 1.75, marginBottom: 12, whiteSpace: "pre-wrap" }} />
      )}
      {block.items.map((item, i) => (
        <div key={item.id} style={{ padding: "10px 0 10px 12px", borderLeft: `3px solid ${D.gold}`, marginBottom: 8 }}>
          <Editable value={item.name} onChange={v => onChange({ ...block, items: block.items.map((it, j) => j === i ? { ...it, name: v } : it) })}
            placeholder="Name" style={{ color: D.black, fontSize: 15, fontWeight: 700 }} />
          <Editable value={item.category} onChange={v => onChange({ ...block, items: block.items.map((it, j) => j === i ? { ...it, category: v } : it) })}
            placeholder="Kategorie" style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }} />
          <Editable value={item.description} onChange={v => onChange({ ...block, items: block.items.map((it, j) => j === i ? { ...it, description: v } : it) })}
            placeholder="Beschreibung" multiline style={{ color: D.gray, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }} />
        </div>
      ))}
      {block.website_url && (
        <a href={block.website_url} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", color: D.navy, textDecoration: "none", padding: "14px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", border: `2px solid ${D.navy}`, margin: "8px 0 0" }}>
          {block.website_label || block.website_url}
        </a>
      )}
    </div>
  );
}

function SpeakerPreview({ block, onChange }: { block: SpeakerBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  return (
    <div>
      {block.photo_url && (
        <img src={block.photo_url} alt={block.name}
          style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${D.gold}`, marginBottom: 12 }} />
      )}
      <Editable value={block.name} onChange={v => onChange({ ...block, name: v })}
        placeholder="Name" style={{ color: D.navy, fontSize: 16, fontWeight: 700, marginBottom: 2 }} />
      <Editable value={block.title} onChange={v => onChange({ ...block, title: v })}
        placeholder="Titel" style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }} />
      <Editable value={block.book} onChange={v => onChange({ ...block, book: v })}
        placeholder="Buch / Kurzbeschrieb" multiline style={{ color: D.black, fontSize: 15, lineHeight: 1.75, marginBottom: 8, whiteSpace: "pre-wrap" }} />
      <Editable value={block.bio} onChange={v => onChange({ ...block, bio: v })}
        placeholder="Bio" multiline style={{ color: D.black, fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-wrap" }} />
    </div>
  );
}

function TextPreview({ block, onChange }: { block: TextBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  return <RichPreview value={block.content} onChange={v => onChange({ ...block, content: v })} placeholder="Text eingeben…" />;
}

function InfoPreview({ block, onChange }: { block: InfoBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  return (
    <div style={{ background: "#f5f5f5", padding: "16px 18px", borderRadius: 6 }}>
      {(block.title !== undefined) && (
        <div style={{ marginBottom: block.title ? 10 : 0 }}>
          <Editable value={block.title} onChange={v => onChange({ ...block, title: v })}
            placeholder="TITEL EINGEBEN…"
            style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }} />
        </div>
      )}
      <RichPreview value={block.content} onChange={v => onChange({ ...block, content: v })} placeholder="Inhalt eingeben…" />
    </div>
  );
}

function DeadlinePreview({ block, lang = "en" }: { block: DeadlineBlock & { label?: string }; lang?: Lang }) {
  const formatted = block.date
    ? new Date(block.date + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
    : "–";
  return (
    <div style={{ padding: "10px 0" }}>
      <p style={{ color: D.gray, fontSize: 13, margin: 0 }}>
        {T[lang].deadline}: <span style={{ color: D.black, fontWeight: 500 }}>{formatted}</span>
      </p>
    </div>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <p style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 16px" }}>
      {label}
    </p>
  );
}

function CustomFieldsPreview({ block }: { block: CampaignBlock }) {
  const fields = (block.custom_fields ?? []).filter(f => f.label || f.value);
  if (!fields.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      {fields.map(f => (
        <div key={f.id} style={{ padding: "10px 0", borderTop: `1px solid ${D.gray2}` }}>
          <p style={{ color: D.navy, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 3px" }}>{f.label}</p>
          <p style={{ color: D.black, fontSize: 15, fontWeight: 600, margin: 0 }}>{f.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main PreviewPanel ─────────────────────────────────────────────────────────

export default function PreviewPanel({
  blocks,
  subject,
  onBlocks,
  lang = "en",
  eventUrl,
}: {
  blocks: CampaignBlock[];
  subject: string;
  onBlocks: (blocks: CampaignBlock[]) => void;
  lang?: Lang;
  eventUrl?: string;
}) {
  const t = T[lang];
  const hasRegisterBlock = blocks.some(b => b.type === "register_button");
  const updateBlock = (i: number, b: CampaignBlock) => {
    const next = blocks.slice();
    next[i] = b;
    onBlocks(next);
  };

  return (
    <div style={{ background: "#F8F9FF", padding: "24px 16px", minHeight: "100%", overflowY: "auto", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", borderRadius: 20, border: `1px solid #D0DDEA`, overflow: "hidden" }}>

        {/* Logo + greeting */}
        <div style={{ padding: "32px 32px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Impact Gstaad" style={{ height: 48, display: "block", margin: "0 auto 20px" }} />
          <div style={{ height: 1, background: D.gray2, marginBottom: 20 }} />
          <p style={{ color: D.navy, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{t.greeting}</p>
        </div>

        {/* Blocks */}
        <div style={{ padding: "0 32px 32px" }}>
          {blocks.map((block, i) => (
            <div key={i} style={{ marginTop: 24 }}>
              {block.type !== "intro" && block.type !== "text" && block.type !== "info" && block.type !== "divider" && block.type !== "register_button" && block.type !== "deadline" && (
                <>
                  <div style={{ height: 1, background: D.gray2, marginBottom: 20 }} />
                  {block.type === "program" ? (
                    <Editable
                      value={(block as ProgramBlock).title || block.label || labelFor(block.type)}
                      onChange={v => updateBlock(i, { ...block, title: v } as ProgramBlock)}
                      placeholder="ZEITPLAN"
                      style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 16 }}
                    />
                  ) : (
                    <SectionHead label={block.label || labelFor(block.type)} />
                  )}
                </>
              )}
              {block.type === "intro" && (
                <IntroPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "event_details" && (
                <EventDetailsPreview block={block} onChange={b => updateBlock(i, b)} subject={subject} lang={lang} />
              )}
              {block.type === "program" && (
                <ProgramPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "finalists" && (
                <FinalistsPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "speaker" && (
                <SpeakerPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "text" && (
                <TextPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "info" && (
                <InfoPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "deadline" && (
                <DeadlinePreview block={block} lang={lang} />
              )}
              {block.type === "divider" && (
                <div style={{ height: 1, background: D.gray2, margin: "8px 0" }} />
              )}
              {block.type === "register_button" && (
                <RegisterButtonPreview block={block as RegisterButtonBlock} lang={lang} />
              )}
              {block.type !== "register_button" && <CustomFieldsPreview block={block} />}
            </div>
          ))}

        </div>

        {/* Footer */}
        <div style={{ background: "#f5f5f5", borderTop: `1px solid ${D.gray2}`, padding: "16px 32px", textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: 11, margin: "0 0 6px" }}>
            Impact Gstaad · <span style={{ color: D.navy }}>impactgstaad.ch</span>
          </p>
          <p style={{ color: "#888", fontSize: 11, margin: 0, textDecoration: "underline" }}>{t.unsubscribe}</p>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 10, color: "#aaa", marginTop: 12 }}>
        Klick auf Text zum direkten Bearbeiten
      </p>
    </div>
  );
}

function labelFor(type: CampaignBlock["type"]): string {
  const m: Partial<Record<CampaignBlock["type"], string>> = {
    event_details: "Event Details",
    program: "Zeitplan",
    finalists: "Finalists / Award",
    speaker: "Keynote Speaker",
    deadline: "Deadline",
  };
  return m[type] ?? type;
}

function RegisterButtonPreview({ block, lang }: { block: RegisterButtonBlock; lang: Lang }) {
  const t = T[lang];
  const formatted = block.deadline
    ? new Date(block.deadline + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div>
      <div style={{ margin: "16px 0", background: D.gold, color: "#fff", textAlign: "center", padding: "14px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
        {t.registerBtn}
      </div>
      {formatted && <p style={{ color: D.gray, fontSize: 13, textAlign: "center", margin: "-8px 0 0" }}>{t.deadline}: {formatted}</p>}
    </div>
  );
}
