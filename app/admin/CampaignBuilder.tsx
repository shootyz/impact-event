"use client";

import { useState, useRef, useEffect } from "react";

// ── Block type definitions ────────────────────────────────────────────────────

export type IntroBlock = {
  type: "intro";
  text: string;
};

export type EventDetailsBlock = {
  type: "event_details";
  date: string;
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

export type CampaignBlock =
  | IntroBlock
  | EventDetailsBlock
  | ProgramBlock
  | FinalistsBlock
  | SpeakerBlock
  | TextBlock
  | DeadlineBlock
  | DividerBlock;

// ── HTML renderer ─────────────────────────────────────────────────────────────

const D = { navy: "#1E3263", gold: "#D28D28", black: "#000000", gray: "#555555", gray2: "#e8e8e8" };

function dividerHtml() {
  return `<div style="height:1px;background:${D.gray2};margin:20px 0;"></div>`;
}

function sectionHeadHtml(label: string) {
  return `<p style="color:${D.gold};font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;font-family:Arial,sans-serif;">${label}</p>`;
}

function renderBlock(block: CampaignBlock): string {
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
      return `${dividerHtml()}
${sectionHeadHtml("Event Details")}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
${rows.join("\n")}
</table>`;
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
${sectionHeadHtml("Program")}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
${slotHtmls.join("\n")}
</table>`;
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
      return `${sectionHeadHtml("Keynote Speaker")}
${block.photo_url ? `<img src="${block.photo_url}" alt="${block.name}" width="100" style="display:block;width:100px;height:100px;object-fit:cover;border-radius:50%;border:3px solid ${D.gold};margin:0 0 16px;" />` : ""}
<p style="color:${D.black};font-size:16px;font-weight:700;margin:0 0 3px;font-family:Arial,sans-serif;">${block.name}</p>
${block.title ? `<p style="color:${D.gold};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;font-family:Arial,sans-serif;">${block.title}</p>` : ""}
${block.book ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 10px;font-family:Arial,sans-serif;">${block.book}</p>` : ""}
${block.bio ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0;font-family:Arial,sans-serif;">${block.bio}</p>` : ""}`;

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

export function renderBlocksToHtml(blocks: CampaignBlock[]): string {
  // Find intro block — everything before it goes before CTA marker
  const introIdx = blocks.findIndex(b => b.type === "intro");
  if (introIdx === -1) return blocks.map(renderBlock).join("\n\n");

  const before = blocks.slice(0, introIdx + 1).map(renderBlock).join("\n\n");
  const after = blocks.slice(introIdx + 1).map(renderBlock).join("\n\n");
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

function EventDetailsEditor({ block, onChange }: { block: EventDetailsBlock; onChange: (b: EventDetailsBlock) => void }) {
  return (
    <div className="space-y-3">
      {(["date", "venue_name", "venue_address", "venue_maps_url", "moderation_name", "moderation_title"] as const).map(k => (
        <div key={k}>
          <label className={labelCls} style={labelSty}>{
            k === "date" ? "Datum" : k === "venue_name" ? "Venue Name" : k === "venue_address" ? "Adresse" :
            k === "venue_maps_url" ? "Google Maps URL" : k === "moderation_name" ? "Moderation Name" : "Moderation Titel"
          }</label>
          <FocusInput value={block[k]} onChange={v => onChange({ ...block, [k]: v })}
            placeholder={
              k === "date" ? "Friday, 14 February 2025" : k === "venue_name" ? "Kirchgemeindehaus Gstaad" :
              k === "venue_address" ? "Untergstaadstrasse 8, 3780 Gstaad" :
              k === "venue_maps_url" ? "https://maps.google.com/?q=…" :
              k === "moderation_name" ? "Carolin Roth" : "Business Moderator & Journalist"
            } />
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
            <button onClick={() => addSubItem(slot.id)} className="text-xs px-3 py-1.5 rounded-lg border font-medium transition" style={{ borderColor: "#D28D28", color: "#D28D28" }}>
              + Unterpunkt
            </button>
          </div>
          <div>
            <label className={labelCls} style={labelSty}>Hinweis <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <FocusInput value={slot.note} onChange={v => updateSlot(slot.id, { note: v })} placeholder="+ Additional speakers to be announced" />
          </div>
        </div>
      ))}
      <button onClick={addSlot} className="w-full py-2 rounded-xl border-2 border-dashed text-sm font-medium transition" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
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
      <button onClick={addItem} className="w-full py-2 rounded-xl border-2 border-dashed text-sm font-medium transition" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
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
            className="text-xs px-3 py-2 rounded-lg border font-medium transition" style={{ borderColor: "#d1d5db", color: "#1E3263" }}
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

function BlockCard({ block, index, total, onChange, onRemove, onMove }: {
  block: CampaignBlock;
  index: number;
  total: number;
  onChange: (b: CampaignBlock) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ background: "#f9fafb", borderBottom: open ? "1px solid #e5e7eb" : "none" }}
        onClick={() => setOpen(o => !o)}>
        <span className="text-lg">{open ? "▾" : "▸"}</span>
        <span className="font-semibold text-sm flex-1" style={{ color: "#1E3263" }}>{BLOCK_LABELS[block.type]}</span>
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
          {block.type === "event_details" && <EventDetailsEditor block={block} onChange={onChange as (b: EventDetailsBlock) => void} />}
          {block.type === "program" && <ProgramEditor block={block} onChange={onChange as (b: ProgramBlock) => void} />}
          {block.type === "finalists" && <FinalistsEditor block={block} onChange={onChange as (b: FinalistsBlock) => void} />}
          {block.type === "speaker" && <SpeakerEditor block={block} onChange={onChange as (b: SpeakerBlock) => void} />}
          {block.type === "text" && <TextEditor block={block} onChange={onChange as (b: TextBlock) => void} />}
          {block.type === "deadline" && <DeadlineEditor block={block} onChange={onChange as (b: DeadlineBlock) => void} />}
          {block.type === "divider" && <p className="text-sm" style={{ color: "#9ca3af" }}>Horizontale Trennlinie</p>}
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
    case "event_details": return { type, date: "", venue_name: "", venue_address: "", venue_maps_url: "", moderation_name: "", moderation_title: "" };
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
  initialZielgruppeId,
  zielgruppen,
}: {
  onSaveDraft: (subject: string, bodyHtml: string, eventUrl: string, blocks: CampaignBlock[], zielgruppeId: string | null, autoId?: string, isAutoSave?: boolean) => Promise<string>;
  campaignId?: string;
  initialSubject?: string;
  initialBlocks?: CampaignBlock[];
  initialEventUrl?: string;
  initialZielgruppeId?: string | null;
  zielgruppen?: ZielgruppeOption[];
}) {
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [eventUrl, setEventUrl] = useState(initialEventUrl ?? "");
  const [zielgruppeId, setZielgruppeId] = useState<string | null>(initialZielgruppeId ?? null);
  const [blocks, setBlocks] = useState<CampaignBlock[]>(
    initialBlocks && initialBlocks.length > 0 ? initialBlocks : [{ type: "intro", text: "" }]
  );
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
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

  // Preview debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch("/api/campaigns/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject || "Vorschau", body_html: bodyHtml, event_url: eventUrl || null }),
      });
      setPreviewHtml(await res.text());
    }, 300);
    return () => clearTimeout(t);
  }, [subject, bodyHtml, eventUrl]);

  const labelCls2 = "block text-xs font-semibold tracking-wide uppercase mb-2";
  const labelSty2 = { color: "#1E3263" };
  const inputCls2 = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition";

  return (
    <div className="flex gap-0" style={{ minHeight: 600 }}>
      {/* Left: live preview */}
      <div className="hidden lg:flex flex-col" style={{ width: "50%", borderRight: "1px solid #e5e7eb" }}>
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#1E3263" }}>Vorschau</p>
        </div>
        <div>
          {previewHtml
            ? <iframe
                srcDoc={previewHtml}
                style={{ width: "100%", border: "none", display: "block", minHeight: 600 }}
                onLoad={e => {
                  const f = e.currentTarget;
                  try { f.style.height = (f.contentWindow?.document.body.scrollHeight ?? 600) + "px"; } catch {}
                }}
              />
            : <div className="flex items-center justify-center py-20 text-xs" style={{ color: "#9ca3af" }}>Wird geladen…</div>
          }
        </div>
      </div>

      {/* Right: editor */}
      <div className="flex-1 p-5 space-y-5" style={{ minWidth: 0 }}>

        {/* Subject */}
        <div>
          <label className={labelCls2} style={labelSty2}>Betreff *</label>
          <input className={inputCls2} style={{ ...inputSty, borderColor: "#d1d5db" }} value={subject}
            onChange={e => setSubject(e.target.value)} placeholder="Impact Circle Event – Invitation"
            onFocus={e => e.currentTarget.style.borderColor = "#1E3263"}
            onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"} />
        </div>

        {/* Blocks */}
        <div>
          <label className={labelCls2} style={labelSty2}>Inhalt</label>
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <BlockCard key={i} block={block} index={i} total={blocks.length}
                onChange={b => updateBlock(i, b)}
                onRemove={() => removeBlock(i)}
                onMove={dir => moveBlock(i, dir)} />
            ))}

            {/* Add block */}
            <div>
              <button onClick={() => setAddMenuOpen(o => !o)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition"
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

        {/* Zielgruppe */}
        <div>
          <label className={labelCls2} style={labelSty2}>Zielgruppe <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional — leer = alle Mitglieder)</span></label>
          <select
            className={inputCls2}
            style={{ ...inputSty, borderColor: "#d1d5db" }}
            value={zielgruppeId ?? ""}
            onChange={e => setZielgruppeId(e.target.value || null)}
            onFocus={e => e.currentTarget.style.borderColor = "#1E3263"}
            onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"}>
            <option value="">Alle Mitglieder</option>
            {zielgruppen?.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
          {(!zielgruppen || zielgruppen.length === 0) && (
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Keine Zielgruppen vorhanden — im Mitglieder-Tab erstellen.</p>
          )}
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
        <button disabled={!canSave || saving}
          className="w-full py-3 rounded-xl border font-semibold text-sm tracking-wide transition disabled:opacity-40"
          style={{ borderColor: "#1E3263", color: "#1E3263" }}
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
  );
}
