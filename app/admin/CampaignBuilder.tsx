"use client";

import { useState, useRef, useEffect } from "react";
import PreviewPanel from "./PreviewPanel";

// ── Block type definitions ────────────────────────────────────────────────────

export type IntroBlock = {
  type: "intro";
  text: string;
};

export type EventDetailsBlock = {
  type: "event_details";
  category: string;
  event_title: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address: string;
  venue_maps_url: string;
  moderation_name: string;
  moderation_title: string;
};

export type ProgramSlot = {
  id: string;
  time: string;
  title: string;
  sub_items: { id: string; title: string; speaker: string }[];
  note: string;
};

export type ProgramBlock = {
  type: "program";
  slots: ProgramSlot[];
};

export type Finalist = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export type FinalistsBlock = {
  type: "finalists";
  title: string;
  intro: string;
  items: Finalist[];
  video_url: string;
  website_url: string;
  website_label: string;
};

export type SpeakerBlock = {
  type: "speaker";
  photo_url: string;
  name: string;
  title: string;
  bio: string;
  book: string;
};

export type TextBlock = {
  type: "text";
  content: string;
};

export type DeadlineBlock = {
  type: "deadline";
  date: string; // ISO date string e.g. "2025-01-05"
};

export type DividerBlock = { type: "divider" };

export type CustomField = { id: string; label: string; value: string };

export type CampaignBlock = (
  | IntroBlock
  | EventDetailsBlock
  | ProgramBlock
  | FinalistsBlock
  | SpeakerBlock
  | TextBlock
  | DeadlineBlock
  | DividerBlock
) & { label?: string; custom_fields?: CustomField[] };

// ── HTML renderer ─────────────────────────────────────────────────────────────

const D = { navy: "#1E3263", gold: "#D28D28", black: "#000000", gray: "#555555", gray2: "#e8e8e8" };

function dividerHtml() {
  return `<div style="height:1px;background:${D.gray2};margin:20px 0;"></div>`;
}

function sectionHeadHtml(label: string) {
  return `<p style="color:${D.gold};font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;font-family:Arial,sans-serif;">${label}</p>`;
}

function renderCustomFields(block: CampaignBlock): string {
  const fields = (block.custom_fields ?? []).filter(f => f.label || f.value);
  if (!fields.length) return "";
  const rows = fields.map(f => `<tr><td style="padding:16px 0;">
  <p style="color:${D.navy};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">${f.label}</p>
  <p style="color:${D.black};font-size:16px;font-weight:600;margin:0;font-family:Arial,sans-serif;">${f.value}</p>
</td></tr>`).join("\n");
  return `\n<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">${rows}</table>`;
}

function renderBlock(block: CampaignBlock, ctx?: { campaignId?: string; appUrl?: string }): string {
  const extra = renderCustomFields(block);
  switch (block.type) {
    case "intro":
      return block.text
        .trim()
        .split(/\n\s*\n/)
        .map((p, i, arr) =>
          `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0${i < arr.length - 1 ? " 0 14px" : ""};font-family:Arial,sans-serif;">${p.trim().replace(/\n/g, "<br/>")}</p>`
        )
        .join("\n");

    case "event_details": {
      const rows = [];
      if (block.category)
        rows.push(`<tr><td style="padding:16px 0 4px;">
  <p style="color:${D.gold};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">${block.category}</p>
</td></tr>`);
      if (block.event_title)
        rows.push(`<tr><td style="padding:${block.category ? "0" : "16px"} 0 16px;">
  <p style="color:${D.navy};font-size:20px;font-weight:700;margin:0;font-family:Arial,sans-serif;">${block.event_title}</p>
</td></tr>`);
      if (block.date)
        rows.push(`<tr><td style="padding:16px 0;">
  <p style="color:${D.navy};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">Date</p>
  <p style="color:${D.black};font-size:16px;font-weight:600;margin:0;font-family:Arial,sans-serif;">${block.date}</p>
</td></tr>`);
      if (block.venue_name)
        rows.push(`<tr><td style="padding:16px 0;">
  <p style="color:${D.navy};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">Venue</p>
  <p style="color:${D.black};font-size:16px;font-weight:600;margin:0 2px;font-family:Arial,sans-serif;">${block.venue_name}</p>
  ${block.venue_address ? `<p style="color:${D.gray};font-size:14px;margin:0 0 4px;font-family:Arial,sans-serif;">${block.venue_address}</p>` : ""}
  ${block.venue_maps_url ? `<a href="${block.venue_maps_url}" style="color:${D.gold};font-size:13px;text-decoration:none;font-family:Arial,sans-serif;">Open in Maps →</a>` : ""}
</td></tr>`);
      if (block.moderation_name)
        rows.push(`<tr><td style="padding:16px 0;">
  <p style="color:${D.navy};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif;">Moderation</p>
  <p style="color:${D.black};font-size:16px;font-weight:600;margin:0 2px;font-family:Arial,sans-serif;">${block.moderation_name}</p>
  ${block.moderation_title ? `<p style="color:${D.gray};font-size:14px;margin:0;font-family:Arial,sans-serif;">${block.moderation_title}</p>` : ""}
</td></tr>`);
      const icsLink = ctx?.campaignId && ctx?.appUrl && block.date
        ? `<tr><td style="padding:12px 0 16px;"><a href="${ctx.appUrl}/api/campaigns/${ctx.campaignId}/ics" style="color:${D.gold};font-size:13px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">&#128197; Zum Kalender hinzufügen</a></td></tr>`
        : "";
      return `${dividerHtml()}
${sectionHeadHtml(block.label || "Event Details")}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
${rows.join("\n")}
${icsLink}
</table>${extra}`;
    }

    case "program": {
      const slotHtmls = block.slots.map((slot, i) => {
        const isFirst = i === 0;
        const isLast = i === block.slots.length - 1;
        const pad = isFirst ? "0 0 16px" : isLast ? "16px 0 0" : "16px 0";
        const subItems = slot.sub_items.filter(s => s.title);
        return `<tr><td style="padding:${pad};">
  <p style="color:${D.navy};font-size:13px;font-weight:700;margin:0 0 8px;font-family:Arial,sans-serif;">${slot.time}</p>
  <p style="color:${D.black};font-size:16px;font-weight:600;margin:0${subItems.length ? " 0 16px" : ""};font-family:Arial,sans-serif;">${slot.title}</p>
  ${subItems.length ? `<table width="100%" cellpadding="0" cellspacing="0">
    ${subItems.map(s => `<tr><td style="padding:10px 0 10px 16px;border-left:3px solid ${D.gold};">
      <p style="color:${D.black};font-size:15px;font-weight:600;margin:0 0 3px;font-family:Arial,sans-serif;">${s.title}</p>
      ${s.speaker ? `<p style="color:${D.gray};font-size:13px;margin:0;font-family:Arial,sans-serif;">${s.speaker}</p>` : ""}
    </td></tr>`).join("\n")}
  </table>` : ""}
  ${slot.note ? `<p style="color:${D.gray};font-size:13px;margin:12px 0 0;font-family:Arial,sans-serif;">${slot.note}</p>` : ""}
</td></tr>`;
      });
      return `${dividerHtml()}
${sectionHeadHtml(block.label || "Program")}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
${slotHtmls.join("\n")}
</table>${extra}`;
    }

    case "finalists": {
      const items = block.items.filter(f => f.name);
      return `${dividerHtml()}
${sectionHeadHtml(block.title || "Green Business Award")}
${block.intro ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 24px;font-family:Arial,sans-serif;">${block.intro}</p>` : ""}
<p style="color:${D.navy};font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;font-family:Arial,sans-serif;">2025 Finalists</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
${items.map(f => `  <tr><td style="padding:12px 0 12px 16px;border-left:3px solid ${D.gold};">
    <p style="color:${D.black};font-size:15px;font-weight:700;margin:0 0 4px;font-family:Arial,sans-serif;">${f.name}</p>
    ${f.category ? `<p style="color:${D.gold};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 10px;font-family:Arial,sans-serif;">${f.category}</p>` : ""}
    ${f.description ? `<p style="color:${D.gray};font-size:14px;line-height:1.6;margin:0;font-family:Arial,sans-serif;">${f.description}</p>` : ""}
  </td></tr>`).join("\n")}
</table>
${block.video_url ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
  <tr><td><a href="${block.video_url}" style="display:block;background:${D.gold};color:#ffffff;text-decoration:none;padding:15px 24px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:center;font-family:Arial,sans-serif;">Watch Award Video</a></td></tr>
</table>` : ""}
${block.website_url ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
  <tr><td><a href="${block.website_url}" style="display:block;color:${D.navy};text-decoration:none;padding:14px 24px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:center;border:2px solid ${D.navy};font-family:Arial,sans-serif;">${block.website_label || block.website_url}</a></td></tr>
</table>` : ""}`;
    }

    case "speaker":
      return `${sectionHeadHtml(block.label || "Keynote Speaker")}
${block.photo_url ? `<img src="${block.photo_url}" alt="${block.name}" width="100" style="display:block;width:100px;height:100px;object-fit:cover;border-radius:50%;border:3px solid ${D.gold};margin:0 0 16px;" />` : ""}
<p style="color:${D.black};font-size:16px;font-weight:700;margin:0 0 3px;font-family:Arial,sans-serif;">${block.name}</p>
${block.title ? `<p style="color:${D.gold};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;font-family:Arial,sans-serif;">${block.title}</p>` : ""}
${block.book ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 10px;font-family:Arial,sans-serif;">${block.book}</p>` : ""}
${block.bio ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0;font-family:Arial,sans-serif;">${block.bio}</p>` : ""}${extra}`;

    case "text":
      return block.content
        .trim()
        .split(/\n\s*\n/)
        .map(p => `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;font-family:Arial,sans-serif;">${p.trim().replace(/\n/g, "<br/>")}</p>`)
        .join("\n");

    case "deadline": {
      const formatted = block.date
        ? new Date(block.date + 'T12:00:00').toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "–";
      return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr><td style="padding:12px 0 12px 16px;border-left:3px solid ${D.gold};">
    <p style="color:${D.black};font-size:15px;font-weight:700;margin:0;font-family:Arial,sans-serif;">Registration deadline: ${formatted}</p>
  </td></tr>
</table>`;
    }

    case "divider":
      return dividerHtml();
  }
}

export function renderBlocksToHtml(blocks: CampaignBlock[], ctx?: { campaignId?: string; appUrl?: string }): string {
  const r = (b: CampaignBlock) => renderBlock(b, ctx);
  const introIdx = blocks.findIndex(b => b.type === "intro");
  if (introIdx === -1) return blocks.map(r).join("\n\n");

  const before = blocks.slice(0, introIdx + 1).map(r).join("\n\n");
  const after = blocks.slice(introIdx + 1).map(r).join("\n\n");
  return `${before}\n\n<!-- CTA -->\n\n${after}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const BLOCK_LABELS: Record<CampaignBlock["type"], string> = {
  intro: "Intro-Text",
  event_details: "Event Details",
  program: "Programm",
  finalists: "Finalists / Award",
  speaker: "Keynote Speaker",
  text: "Text-Block",
  deadline: "Deadline",
  divider: "Trennlinie",
};

// ── Sub-editors ───────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition";
const inputSty = { borderColor: "#d1d5db", background: "white", color: "#111" };
const labelCls = "block text-xs font-semibold tracking-wide uppercase mb-1";
const labelSty = { color: "#1E3263" };

function FocusInput({ value, onChange, placeholder, multiline, rows }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; rows?: number;
}) {
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const style = { ...inputSty, borderColor: focus ? "#1E3263" : "#d1d5db" };

  const autoResize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  if (multiline)
    return <textarea ref={ref} className={inputCls} style={{ ...style, resize: "none", minHeight: rows ? rows * 24 : 80, overflow: "hidden" }}
      value={value} onChange={e => { onChange(e.target.value); autoResize(); }} placeholder={placeholder}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      onInput={autoResize} />;
  return <input className={inputCls} style={style}
    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />;
}

function IntroEditor({ block, onChange }: { block: IntroBlock; onChange: (b: IntroBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls} style={labelSty}>Text</label>
        <FocusInput multiline rows={5} value={block.text} onChange={v => onChange({ ...block, text: v })}
          placeholder={"We are pleased to invite you to the Impact Circle Event…\n\nWe are particularly honoured to welcome…"} />
        <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Leerzeile = neuer Absatz. Der Register Now Button wird automatisch darunter eingefügt.</p>
      </div>
    </div>
  );
}

function EventDetailsEditor({ block, onChange, subject }: { block: EventDetailsBlock; onChange: (b: EventDetailsBlock) => void; subject?: string }) {
  function toInputDate(display: string): string {
    if (!display) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
    const d = new Date(display);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }
  function toDisplayDate(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  const CATEGORIES = ["IMPACT CIRCLE EVENT", "IMPACT WORKSHOP", "IMPACT EXPERIENCE"];
  const isCustom = block.category !== "" && !CATEGORIES.includes(block.category);

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls} style={labelSty}>Kategorie</label>
        <select
          value={isCustom ? "__custom__" : block.category}
          onChange={e => onChange({ ...block, category: e.target.value === "__custom__" ? "" : e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", outline: "none" }}>
          <option value="">— Wählen —</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__custom__">Eigene Kategorie…</option>
        </select>
        {(isCustom || block.category === "") && (block.category !== undefined) && (
          <input
            value={isCustom ? block.category : ""}
            onChange={e => onChange({ ...block, category: e.target.value })}
            placeholder="Eigene Kategorie eingeben"
            className="w-full rounded-lg border px-3 py-2 text-sm mt-2"
            style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", outline: "none" }}
          />
        )}
      </div>
      <div>
        <label className={labelCls} style={labelSty}>Event-Titel</label>
        <input
          value={block.event_title}
          onChange={e => onChange({ ...block, event_title: e.target.value })}
          placeholder="z.B. The Future of Alpine Business"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", outline: "none" }}
        />
      </div>
      <div>
        <label className={labelCls} style={labelSty}>Datum</label>
        <input
          type="date"
          value={toInputDate(block.date)}
          onChange={e => onChange({ ...block, date: toDisplayDate(e.target.value) })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", outline: "none" }}
        />
      </div>
      <div>
        <label className={labelCls} style={labelSty}>Uhrzeit</label>
        <input
          type="time"
          value={block.time ?? ""}
          onChange={e => onChange({ ...block, time: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", outline: "none" }}
        />
      </div>
      {(["venue_name", "venue_address", "venue_maps_url", "moderation_name", "moderation_title"] as const).map(k => (
        <div key={k}>
          <label className={labelCls} style={labelSty}>{
            k === "venue_name" ? "Venue Name" : k === "venue_address" ? "Adresse" :
            k === "venue_maps_url" ? "Google Maps URL" : k === "moderation_name" ? "Moderation Name" : "Moderation Titel"
          }</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FocusInput value={block[k]} onChange={v => onChange({ ...block, [k]: v })}
                placeholder={
                  k === "venue_name" ? "Kirchgemeindehaus Gstaad" :
                  k === "venue_address" ? "Untergstaadstrasse 8, 3780 Gstaad" :
                  k === "venue_maps_url" ? "https://maps.google.com/?q=…" :
                  k === "moderation_name" ? "Carolin Roth" : "Business Moderator & Journalist"
                } />
            </div>
            {k === "venue_address" && block.venue_address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.venue_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="In Google Maps öffnen"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition"
                style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", whiteSpace: "nowrap", textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                Maps
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramEditor({ block, onChange }: { block: ProgramBlock; onChange: (b: ProgramBlock) => void }) {
  const updateSlot = (id: string, patch: Partial<ProgramSlot>) =>
    onChange({ ...block, slots: block.slots.map(s => s.id === id ? { ...s, ...patch } : s) });
  const addSlot = () => onChange({ ...block, slots: [...block.slots, { id: uid(), time: "", title: "", sub_items: [], note: "" }] });
  const removeSlot = (id: string) => onChange({ ...block, slots: block.slots.filter(s => s.id !== id) });
  const addSubItem = (slotId: string) => {
    const slot = block.slots.find(s => s.id === slotId)!;
    updateSlot(slotId, { sub_items: [...slot.sub_items, { id: uid(), title: "", speaker: "" }] });
  };
  const removeSubItem = (slotId: string, subId: string) => {
    const slot = block.slots.find(s => s.id === slotId)!;
    updateSlot(slotId, { sub_items: slot.sub_items.filter(s => s.id !== subId) });
  };
  const updateSubItem = (slotId: string, subId: string, patch: Partial<{ title: string; speaker: string }>) => {
    const slot = block.slots.find(s => s.id === slotId)!;
    updateSlot(slotId, { sub_items: slot.sub_items.map(s => s.id === subId ? { ...s, ...patch } : s) });
  };

  return (
    <div className="space-y-4">
      {block.slots.map((slot, i) => (
        <div key={slot.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#e5e7eb", background: "#fafafa" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1E3263" }}>Slot {i + 1}</span>
            <button onClick={() => removeSlot(slot.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#dc2626" }}>Entfernen</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelSty}>Zeit</label>
              <FocusInput value={slot.time} onChange={v => updateSlot(slot.id, { time: v })} placeholder="14:00 – 15:30" />
            </div>
            <div>
              <label className={labelCls} style={labelSty}>Titel</label>
              <FocusInput value={slot.title} onChange={v => updateSlot(slot.id, { title: v })} placeholder="Speeches & Panel Discussion" />
            </div>
          </div>
          {slot.sub_items.length > 0 && (
            <div className="space-y-2">
              <label className={labelCls} style={labelSty}>Unterpunkte</label>
              {slot.sub_items.map(sub => (
                <div key={sub.id} className="grid grid-cols-2 gap-2 items-start">
                  <FocusInput value={sub.title} onChange={v => updateSubItem(slot.id, sub.id, { title: v })} placeholder="The New Nature of Business" />
                  <div className="flex gap-2">
                    <FocusInput value={sub.speaker} onChange={v => updateSubItem(slot.id, sub.id, { speaker: v })} placeholder="André Hoffmann · Roche" />
                    <button onClick={() => removeSubItem(slot.id, sub.id)} className="text-xs px-2 rounded shrink-0" style={{ color: "#dc2626" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => addSubItem(slot.id)} className="text-xs px-3 py-1.5 rounded-lg border font-medium transition" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#D28D28"; (e.currentTarget as HTMLElement).style.color = "#D28D28"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}>
              + Unterpunkt
            </button>
          </div>
          <div>
            <label className={labelCls} style={labelSty}>Hinweis <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <FocusInput value={slot.note} onChange={v => updateSlot(slot.id, { note: v })} placeholder="+ Additional speakers to be announced" />
          </div>
        </div>
      ))}
      <button onClick={addSlot} className="px-3 py-1.5 rounded-lg border text-xs font-medium transition" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1E3263"; (e.currentTarget as HTMLElement).style.color = "#1E3263"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}>
        + Slot hinzufügen
      </button>
    </div>
  );
}

function FinalistsEditor({ block, onChange }: { block: FinalistsBlock; onChange: (b: FinalistsBlock) => void }) {
  const addItem = () => onChange({ ...block, items: [...block.items, { id: uid(), name: "", category: "", description: "" }] });
  const removeItem = (id: string) => onChange({ ...block, items: block.items.filter(f => f.id !== id) });
  const updateItem = (id: string, patch: Partial<Finalist>) =>
    onChange({ ...block, items: block.items.map(f => f.id === id ? { ...f, ...patch } : f) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={labelSty}>Sektions-Titel</label>
          <FocusInput value={block.title} onChange={v => onChange({ ...block, title: v })} placeholder="Green Business Award" />
        </div>
        <div>
          <label className={labelCls} style={labelSty}>Finalists-Titel</label>
          <FocusInput value={block.intro} onChange={v => onChange({ ...block, intro: v })} placeholder="We are proud to host the 6th annual…" />
        </div>
      </div>
      {block.items.map((f, i) => (
        <div key={f.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#e5e7eb", background: "#fafafa" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1E3263" }}>Finalist {i + 1}</span>
            <button onClick={() => removeItem(f.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#dc2626" }}>Entfernen</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelSty}>Name</label>
              <FocusInput value={f.name} onChange={v => updateItem(f.id, { name: v })} placeholder="Algrano" />
            </div>
            <div>
              <label className={labelCls} style={labelSty}>Kategorie</label>
              <FocusInput value={f.category} onChange={v => updateItem(f.id, { category: v })} placeholder="Direct Coffee Trade" />
            </div>
          </div>
          <div>
            <label className={labelCls} style={labelSty}>Beschreibung</label>
            <FocusInput value={f.description} onChange={v => updateItem(f.id, { description: v })} placeholder="Online marketplace increasing producer earnings…" />
          </div>
        </div>
      ))}
      <button onClick={addItem} className="px-3 py-1.5 rounded-lg border text-xs font-medium transition" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1E3263"; (e.currentTarget as HTMLElement).style.color = "#1E3263"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}>
        + Finalist hinzufügen
      </button>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={labelSty}>Video URL <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
          <FocusInput value={block.video_url} onChange={v => onChange({ ...block, video_url: v })} placeholder="https://youtu.be/…" />
        </div>
        <div>
          <label className={labelCls} style={labelSty}>Website URL <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
          <FocusInput value={block.website_url} onChange={v => onChange({ ...block, website_url: v })} placeholder="https://greenbusinessaward.ch" />
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={labelSty}>Website Button-Text</label>
          <FocusInput value={block.website_label} onChange={v => onChange({ ...block, website_label: v })} placeholder="greenbusinessaward.ch" />
        </div>
      </div>
    </div>
  );
}

function SpeakerEditor({ block, onChange }: { block: SpeakerBlock; onChange: (b: SpeakerBlock) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls} style={labelSty}>Foto</label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const d = await res.json();
          if (d.url) onChange({ ...block, photo_url: d.url });
          setUploading(false);
        }} />
        <div className="flex gap-3 items-center">
          <button onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition" style={{ borderColor: "#d1d5db", color: "#1E3263" }}
            disabled={uploading}>
            {uploading ? "Wird hochgeladen…" : block.photo_url ? "Bild ersetzen" : "Bild hochladen"}
          </button>
          {block.photo_url && <img src={block.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #D28D28" }} />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={labelSty}>Name</label>
          <FocusInput value={block.name} onChange={v => onChange({ ...block, name: v })} placeholder="André Hoffmann" />
        </div>
        <div>
          <label className={labelCls} style={labelSty}>Titel</label>
          <FocusInput value={block.title} onChange={v => onChange({ ...block, title: v })} placeholder="Vice-Chairman, Roche · Impact Advisory Board" />
        </div>
      </div>
      <div>
        <label className={labelCls} style={labelSty}>Buch / Vortrag <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
        <FocusInput value={block.book} onChange={v => onChange({ ...block, book: v })} placeholder="André will present his new book The New Nature of Business…" />
      </div>
      <div>
        <label className={labelCls} style={labelSty}>Bio</label>
        <FocusInput multiline rows={3} value={block.bio} onChange={v => onChange({ ...block, bio: v })} placeholder="A groundbreaking work on how business leaders…" />
      </div>
    </div>
  );
}

function TextEditor({ block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void }) {
  return (
    <div>
      <label className={labelCls} style={labelSty}>Text</label>
      <FocusInput multiline rows={4} value={block.content} onChange={v => onChange({ ...block, content: v })} placeholder="Fliesstext…" />
    </div>
  );
}

function DeadlineEditor({ block, onChange }: { block: DeadlineBlock; onChange: (b: DeadlineBlock) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="space-y-2">
      <label className={labelCls} style={labelSty}>Datum</label>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold" style={{ color: "#000", whiteSpace: "nowrap" }}>Registration deadline:</span>
        <input
          type="date"
          value={block.date}
          onChange={e => onChange({ ...block, date: e.target.value })}
          className={inputCls}
          style={{ ...inputSty, borderColor: focus ? "#1E3263" : "#d1d5db", maxWidth: 180 }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      </div>
      {block.date && (
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          Vorschau: <strong>Registration deadline: {new Date(block.date + 'T12:00:00').toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>
        </p>
      )}
    </div>
  );
}

// ── Block card ────────────────────────────────────────────────────────────────

function CustomFieldsEditor({ block, onChange }: { block: CampaignBlock; onChange: (b: CampaignBlock) => void }) {
  const fields = block.custom_fields ?? [];
  const update = (id: string, patch: Partial<CustomField>) =>
    onChange({ ...block, custom_fields: fields.map(f => f.id === id ? { ...f, ...patch } : f) });
  const add = () =>
    onChange({ ...block, custom_fields: [...fields, { id: uid(), label: "", value: "" }] });
  const remove = (id: string) =>
    onChange({ ...block, custom_fields: fields.filter(f => f.id !== id) });

  return (
    <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px dashed #e5e7eb" }}>
      {fields.map(f => (
        <div key={f.id} className="flex gap-2 items-center">
          <input value={f.label} onChange={e => update(f.id, { label: e.target.value })}
            placeholder="Bezeichnung" className="rounded-lg border px-2 py-1.5 text-xs w-32 flex-shrink-0"
            style={{ borderColor: "#d1d5db", color: "#1E3263", outline: "none" }} />
          <input value={f.value} onChange={e => update(f.id, { value: e.target.value })}
            placeholder="Wert" className="flex-1 rounded-lg border px-2 py-1.5 text-xs"
            style={{ borderColor: "#d1d5db", color: "#1E3263", outline: "none" }} />
          <button onClick={() => remove(f.id)}
            className="w-6 h-6 rounded border text-xs font-bold flex-shrink-0"
            style={{ borderColor: "#fecaca", color: "#dc2626" }}>✕</button>
        </div>
      ))}
      <button onClick={add}
        className="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
        style={{ borderColor: "#d1d5db", color: "#6b7280" }}>+ Feld hinzufügen</button>
    </div>
  );
}

function BlockCard({ block, index, total, onChange, onRemove, onMove, subject }: {
  block: CampaignBlock;
  index: number;
  total: number;
  onChange: (b: CampaignBlock) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  subject?: string;
}) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  function startRename(e: React.MouseEvent) {
    e.stopPropagation();
    setRenameVal(block.label || BLOCK_LABELS[block.type]);
    setRenaming(true);
    setTimeout(() => renameRef.current?.select(), 0);
  }
  function commitRename() {
    const trimmed = renameVal.trim();
    onChange({ ...block, label: trimmed && trimmed !== BLOCK_LABELS[block.type] ? trimmed : undefined });
    setRenaming(false);
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ background: "#f9fafb", borderBottom: open ? "1px solid #e5e7eb" : "none" }}
        onClick={() => !renaming && setOpen(o => !o)}>
        <span className="text-lg">{open ? "▾" : "▸"}</span>
        {renaming ? (
          <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false); }}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-sm font-semibold rounded px-1 border"
            style={{ color: "#1E3263", borderColor: "#d1d5db", outline: "none" }} />
        ) : (
          <span className="font-semibold text-sm flex-1" style={{ color: "#1E3263" }}
            onDoubleClick={startRename} title="Doppelklick zum Umbenennen">
            {block.label || BLOCK_LABELS[block.type]}
          </span>
        )}
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button disabled={index === 0} onClick={() => onMove(-1)}
            className="w-7 h-7 rounded-lg border text-xs font-bold transition disabled:opacity-30"
            style={{ borderColor: "#d1d5db", color: "#6b7280" }}>↑</button>
          <button disabled={index === total - 1} onClick={() => onMove(1)}
            className="w-7 h-7 rounded-lg border text-xs font-bold transition disabled:opacity-30"
            style={{ borderColor: "#d1d5db", color: "#6b7280" }}>↓</button>
          <button onClick={onRemove}
            className="w-7 h-7 rounded-lg border text-xs font-bold transition"
            style={{ borderColor: "#fecaca", color: "#dc2626" }}>✕</button>
        </div>
      </div>
      {/* Body */}
      {open && (
        <div className="p-4">
          {block.type === "intro" && <IntroEditor block={block} onChange={onChange as (b: IntroBlock) => void} />}
          {block.type === "event_details" && <EventDetailsEditor block={block} onChange={onChange as (b: EventDetailsBlock) => void} subject={subject} />}
          {block.type === "program" && <ProgramEditor block={block} onChange={onChange as (b: ProgramBlock) => void} />}
          {block.type === "finalists" && <FinalistsEditor block={block} onChange={onChange as (b: FinalistsBlock) => void} />}
          {block.type === "speaker" && <SpeakerEditor block={block} onChange={onChange as (b: SpeakerBlock) => void} />}
          {block.type === "text" && <TextEditor block={block} onChange={onChange as (b: TextBlock) => void} />}
          {block.type === "deadline" && <DeadlineEditor block={block} onChange={onChange as (b: DeadlineBlock) => void} />}
          {block.type === "divider" && <p className="text-sm" style={{ color: "#9ca3af" }}>Horizontale Trennlinie</p>}
          {block.type !== "divider" && <CustomFieldsEditor block={block} onChange={onChange} />}
        </div>
      )}
    </div>
  );
}

// ── Add block menu ────────────────────────────────────────────────────────────

const ADDABLE_BLOCKS: { type: CampaignBlock["type"]; label: string; icon: string }[] = [
  { type: "intro", label: "Intro-Text", icon: "✍️" },
  { type: "event_details", label: "Event Details", icon: "📅" },
  { type: "program", label: "Programm", icon: "📋" },
  { type: "finalists", label: "Finalists / Award", icon: "🏆" },
  { type: "speaker", label: "Keynote Speaker", icon: "🎤" },
  { type: "text", label: "Text-Block", icon: "📝" },
  { type: "deadline", label: "Deadline", icon: "⏰" },
  { type: "divider", label: "Trennlinie", icon: "—" },
];

function defaultBlock(type: CampaignBlock["type"]): CampaignBlock {
  switch (type) {
    case "intro": return { type, text: "" };
    case "event_details": return { type, category: "", event_title: "", date: "", time: "13:00", venue_name: "", venue_address: "", venue_maps_url: "", moderation_name: "", moderation_title: "" };
    case "program": return { type, slots: [{ id: uid(), time: "", title: "", sub_items: [], note: "" }] };
    case "finalists": return { type, title: "Green Business Award", intro: "", items: [{ id: uid(), name: "", category: "", description: "" }], video_url: "", website_url: "", website_label: "" };
    case "speaker": return { type, photo_url: "", name: "", title: "", bio: "", book: "" };
    case "text": return { type, content: "" };
    case "deadline": return { type, date: "" };
    case "divider": return { type: "divider" };
  }
}

// ── Main CampaignBuilder ──────────────────────────────────────────────────────

export type ZielgruppeOption = { id: string; name: string };

export default function CampaignBuilder({
  onSaveDraft,
  campaignId,
  initialSubject,
  initialBlocks,
  initialEventUrl,
  zielgruppeId,
  onZielgruppeChange,
  zielgruppen,
}: {
  onSaveDraft: (subject: string, bodyHtml: string, eventUrl: string, blocks: CampaignBlock[], zielgruppeId: string | null, autoId?: string, isAutoSave?: boolean) => Promise<string>;
  campaignId?: string;
  initialSubject?: string;
  initialBlocks?: CampaignBlock[];
  initialEventUrl?: string;
  zielgruppeId: string | null;
  onZielgruppeChange: (id: string | null) => void;
  zielgruppen?: ZielgruppeOption[];
}) {
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [eventUrl, setEventUrl] = useState(initialEventUrl ?? (typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "")));
  const setZielgruppeId = onZielgruppeChange;
  const [blocks, setBlocks] = useState<CampaignBlock[]>(
    initialBlocks && initialBlocks.length > 0 ? initialBlocks : [{ type: "intro", text: "" }]
  );
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const autoIdRef = useRef<string | undefined>(campaignId);
  const isDirtyRef = useRef(false);
  const firstSaveDoneRef = useRef(!!campaignId);
  const subjectRef = useRef(subject);
  const bodyHtmlRef = useRef("");
  const eventUrlRef = useRef(eventUrl);
  const blocksRef = useRef(blocks);
  const zielgruppeIdRef = useRef(zielgruppeId);
  const updateBlock = (i: number, b: CampaignBlock) =>
    setBlocks(prev => prev.map((x, idx) => idx === i ? b : x));
  const removeBlock = (i: number) =>
    setBlocks(prev => prev.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: -1 | 1) =>
    setBlocks(prev => {
      const next = [...prev];
      const j = i + dir;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const addBlock = (type: CampaignBlock["type"]) => {
    setBlocks(prev => [...prev, defaultBlock(type)]);
    setAddMenuOpen(false);
  };

  const bodyHtml = renderBlocksToHtml(blocks);
  const canSave = subject.trim() && blocks.length > 0;

  // Keep refs in sync so the interval always reads latest values
  useEffect(() => { subjectRef.current = subject; isDirtyRef.current = true; }, [subject]);
  useEffect(() => { eventUrlRef.current = eventUrl; isDirtyRef.current = true; }, [eventUrl]);
  useEffect(() => { blocksRef.current = blocks; isDirtyRef.current = true; }, [blocks]);
  useEffect(() => { zielgruppeIdRef.current = zielgruppeId; isDirtyRef.current = true; }, [zielgruppeId]);
  useEffect(() => { bodyHtmlRef.current = bodyHtml; }, [bodyHtml]);

  // First-save: 2 seconds after first keystroke
  useEffect(() => {
    if (firstSaveDoneRef.current || !isDirtyRef.current || !subjectRef.current.trim()) return;
    const t = setTimeout(async () => {
      if (firstSaveDoneRef.current) return;
      firstSaveDoneRef.current = true;
      isDirtyRef.current = false;
      setAutoSaveStatus("Wird gespeichert…");
      try {
        const id = await onSaveDraft(subjectRef.current, bodyHtmlRef.current, eventUrlRef.current, blocksRef.current, zielgruppeIdRef.current, autoIdRef.current, true);
        autoIdRef.current = id;
        const time = new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
        setAutoSaveStatus(`Automatisch gespeichert · ${time}`);
      } catch {
        firstSaveDoneRef.current = false;
        setAutoSaveStatus("Fehler beim Speichern");
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [subject, blocks, eventUrl, zielgruppeId, onSaveDraft]);

  // Auto-save every 20 seconds if dirty and subject is non-empty
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isDirtyRef.current || !subjectRef.current.trim()) return;
      isDirtyRef.current = false;
      setAutoSaveStatus("Wird gespeichert…");
      try {
        const id = await onSaveDraft(subjectRef.current, bodyHtmlRef.current, eventUrlRef.current, blocksRef.current, zielgruppeIdRef.current, autoIdRef.current, true);
        autoIdRef.current = id;
        const time = new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
        setAutoSaveStatus(`Automatisch gespeichert · ${time}`);
      } catch {
        setAutoSaveStatus("Fehler beim Speichern");
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [onSaveDraft]);


  const labelCls2 = "block text-xs font-semibold tracking-wide uppercase mb-2";
  const labelSty2 = { color: "#1E3263" };
  const inputCls2 = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition";

  return (
    <div className="flex gap-0" style={{ minHeight: 600 }}>
      {/* Left: live editable preview */}
      <div className="hidden lg:flex flex-col" style={{ width: "50%", borderRight: "1px solid #e5e7eb", overflowY: "auto", maxHeight: "80vh" }}>
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#1E3263" }}>Vorschau</p>
        </div>
        <PreviewPanel blocks={blocks} subject={subject} onBlocks={setBlocks} />
      </div>

      {/* Right: editor */}
      <div className="flex-1 p-5 space-y-5" style={{ minWidth: 0 }}>

        {/* Subject + Zielgruppe */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className={labelCls2} style={labelSty2}>Betreff *</label>
            <input className={inputCls2} style={{ ...inputSty, borderColor: "#d1d5db" }} value={subject}
              onChange={e => setSubject(e.target.value)} placeholder="Impact Circle Event – Invitation"
              onFocus={e => e.currentTarget.style.borderColor = "#1E3263"}
              onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"} />
          </div>
          <div className="flex-shrink-0">
            <label className={labelCls2} style={labelSty2}>Zielgruppe</label>
            <select
              className="rounded-lg border px-3 py-2 text-xs outline-none transition"
              style={{ borderColor: "#d1d5db", color: "#1E3263", background: "white" }}
              value={zielgruppeId ?? ""}
              onChange={e => setZielgruppeId(e.target.value || null)}
              onFocus={e => e.currentTarget.style.borderColor = "#1E3263"}
              onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"}>
              <option value="">Alle Mitglieder</option>
              {zielgruppen?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
        </div>

        {/* Blocks */}
        <div>
          <label className={labelCls2} style={labelSty2}>Inhalt</label>
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <BlockCard key={i} block={block} index={i} total={blocks.length}
                onChange={b => updateBlock(i, b)}
                onRemove={() => removeBlock(i)}
                onMove={dir => moveBlock(i, dir)}
                subject={subject} />
            ))}

            {/* Add block */}
            <div>
              <button onClick={() => setAddMenuOpen(o => !o)}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
                style={{ borderColor: addMenuOpen ? "#1E3263" : "#d1d5db", color: addMenuOpen ? "#1E3263" : "#6b7280" }}>
                {addMenuOpen ? "▴ Schliessen" : "+ Block hinzufügen"}
              </button>
              {addMenuOpen && (
                <div className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                  {ADDABLE_BLOCKS.map(ab => (
                    <button key={ab.type} onClick={() => addBlock(ab.type)}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition"
                      style={{ color: "#111", borderBottom: "1px solid #f3f4f6" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
                      <span>{ab.icon}</span>
                      <span>{ab.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event URL */}
        <div>
          <label className={labelCls2} style={labelSty2}>Register-Button URL <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
          <input className={inputCls2} style={{ ...inputSty, borderColor: "#d1d5db" }} value={eventUrl}
            onChange={e => setEventUrl(e.target.value)} placeholder="https://impactgstaad.vercel.app"
            onFocus={e => e.currentTarget.style.borderColor = "#1E3263"}
            onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"} />
        </div>

        {/* Result */}
        {/* Auto-save status */}
        {autoSaveStatus && (
          <p className="text-xs text-center" style={{ color: "#9ca3af" }}>{autoSaveStatus}</p>
        )}

        {result && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{
            background: result.ok ? "#f0fdf4" : "#fef2f2",
            color: result.ok ? "#16a34a" : "#dc2626",
            border: `1px solid ${result.ok ? "#bbf7d0" : "#fecaca"}`
          }}>
            {result.msg}
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button disabled={!canSave || saving}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition disabled:opacity-40"
            style={{ background: "#D28D28", color: "white" }}
            onClick={async () => {
              setSaving(true); setResult(null);
              isDirtyRef.current = false;
              const id = await onSaveDraft(subject, bodyHtml, eventUrl, blocks, zielgruppeId, autoIdRef.current);
              autoIdRef.current = id;
              setSaving(false);
              const time = new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
              setAutoSaveStatus(null);
              setResult({ ok: true, msg: `Gespeichert · ${time}` });
            }}>
            {saving ? "Wird gespeichert…" : "Als Entwurf speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
