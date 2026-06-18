"use client";

import { useRef, useEffect } from "react";
import type {
  CampaignBlock, IntroBlock, EventDetailsBlock, ProgramBlock,
  FinalistsBlock, SpeakerBlock, TextBlock, DeadlineBlock,
} from "./CampaignBuilder";

const D = { navy: "#1E3263", gold: "#D28D28", black: "#1a1a1a", gray: "#6b7280", gray2: "#e8e8e8" };

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
        if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); (e.target as HTMLElement).blur(); }
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

function IntroPreview({ block, onChange }: { block: IntroBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  return (
    <Editable
      value={block.text}
      onChange={v => onChange({ ...block, text: v })}
      placeholder="Intro-Text eingeben…"
      multiline
      style={{ color: D.black, fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-wrap" }}
    />
  );
}

function EventDetailsPreview({ block, onChange }: { block: EventDetailsBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  const field = (label: string, value: string, key: keyof EventDetailsBlock) => (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${D.gray2}` }}>
      <p style={{ color: D.navy, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
      <Editable value={value} onChange={v => onChange({ ...block, [key]: v })}
        placeholder="—" style={{ color: D.black, fontSize: 15, fontWeight: 600 }} />
    </div>
  );
  return (
    <div>
      {block.date && field("Date", block.date, "date")}
      {(block.time || true) && field("Time", block.time ?? "", "time")}
      {field("Venue", block.venue_name, "venue_name")}
      {field("Address", block.venue_address, "venue_address")}
      {block.moderation_name && field("Moderation", block.moderation_name, "moderation_name")}
      {block.moderation_title && field("Moderation Title", block.moderation_title, "moderation_title")}
    </div>
  );
}

function ProgramPreview({ block, onChange }: { block: ProgramBlock & { label?: string; custom_fields?: { id: string; label: string; value: string }[] }; onChange: (b: typeof block) => void }) {
  const updateSlot = (id: string, patch: Partial<typeof block.slots[0]>) =>
    onChange({ ...block, slots: block.slots.map(s => s.id === id ? { ...s, ...patch } : s) });

  return (
    <div>
      {block.slots.map(slot => (
        <div key={slot.id} style={{ padding: "14px 0", borderBottom: `1px solid ${D.gray2}` }}>
          <Editable value={slot.time} onChange={v => updateSlot(slot.id, { time: v })}
            placeholder="Zeit" style={{ color: D.navy, fontSize: 12, fontWeight: 700, marginBottom: 4 }} />
          <Editable value={slot.title} onChange={v => updateSlot(slot.id, { title: v })}
            placeholder="Titel" style={{ color: D.black, fontSize: 15, fontWeight: 600 }} />
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
        placeholder="Name" style={{ color: D.black, fontSize: 16, fontWeight: 700, marginBottom: 2 }} />
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
  return (
    <Editable value={block.content} onChange={v => onChange({ ...block, content: v })}
      placeholder="Text eingeben…" multiline
      style={{ color: D.black, fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-wrap" }} />
  );
}

function DeadlinePreview({ block }: { block: DeadlineBlock & { label?: string } }) {
  const formatted = block.date
    ? new Date(block.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "–";
  return (
    <div style={{ padding: "10px 0 10px 14px", borderLeft: `3px solid ${D.gold}` }}>
      <p style={{ color: D.black, fontSize: 15, fontWeight: 700, margin: 0 }}>
        Registration deadline: {formatted}
      </p>
    </div>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <p style={{ color: D.navy, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 16px" }}>
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
}: {
  blocks: CampaignBlock[];
  subject: string;
  onBlocks: (blocks: CampaignBlock[]) => void;
}) {
  const updateBlock = (i: number, b: CampaignBlock) => {
    const next = blocks.slice();
    next[i] = b;
    onBlocks(next);
  };

  return (
    <div style={{ background: "#F8F9FF", padding: "24px 16px", minHeight: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", borderRadius: 20, border: `1px solid #D0DDEA`, overflow: "hidden" }}>

        {/* Logo + greeting */}
        <div style={{ padding: "32px 32px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Impact Gstaad" style={{ height: 24, marginBottom: 20 }} />
          <div style={{ height: 1, background: D.gray2, marginBottom: 20 }} />
          <p style={{ color: D.navy, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Dear [name],</p>
        </div>

        {/* Blocks */}
        <div style={{ padding: "0 32px 32px" }}>
          {blocks.map((block, i) => (
            <div key={i} style={{ marginTop: 24 }}>
              {block.type !== "intro" && block.type !== "text" && block.type !== "divider" && (
                <>
                  <div style={{ height: 1, background: D.gray2, marginBottom: 20 }} />
                  <SectionHead label={block.label || labelFor(block.type)} />
                </>
              )}
              {block.type === "intro" && (
                <IntroPreview block={block} onChange={b => updateBlock(i, b)} />
              )}
              {block.type === "event_details" && (
                <EventDetailsPreview block={block} onChange={b => updateBlock(i, b)} />
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
              {block.type === "deadline" && (
                <DeadlinePreview block={block} />
              )}
              {block.type === "divider" && (
                <div style={{ height: 1, background: D.gray2, margin: "8px 0" }} />
              )}
              <CustomFieldsPreview block={block} />
            </div>
          ))}

          {/* Register button placeholder */}
          <div style={{ marginTop: 28, background: D.gold, color: "#fff", textAlign: "center", padding: "14px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            Register Now
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#f5f5f5", borderTop: `1px solid ${D.gray2}`, padding: "16px 32px", textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: 11, margin: "0 0 6px" }}>
            Impact Gstaad · <span style={{ color: D.navy }}>impactgstaad.ch</span>
          </p>
          <p style={{ color: "#888", fontSize: 11, margin: 0, textDecoration: "underline" }}>Unsubscribe</p>
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
    program: "Programm",
    finalists: "Finalists / Award",
    speaker: "Keynote Speaker",
    deadline: "Deadline",
  };
  return m[type] ?? type;
}
