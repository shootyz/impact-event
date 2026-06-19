// Static React renderer for emails — mirrors PreviewPanel styles exactly.
// No "use client", no hooks, no Tiptap. Use with renderToStaticMarkup.
import React from "react";
import { type Lang, T, DATE_LOCALE } from "./i18n";
import type { CampaignBlock, ProgramBlock } from "./campaign-renderer";

const D = { navy: "#1E3263", gold: "#D28D28", black: "#1a1a1a", gray: "#6b7280", gray2: "#e8e8e8" };

function SectionHead({ label }: { label: string }) {
  return <p style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 16px", fontFamily: "Arial,sans-serif" }}>{label}</p>;
}

function Divider() {
  return <div style={{ height: 1, background: D.gray2, margin: "20px 0" }} />;
}

function RichHtml({ html }: { html: string }) {
  if (!html || html === "<p></p>") return null;
  return <div style={{ fontFamily: "Arial,sans-serif", fontSize: 15, lineHeight: 1.75, color: D.black }} dangerouslySetInnerHTML={{ __html: html }} />;
}

function labelFor(type: string, t: typeof T["en"]) {
  const map: Record<string, string> = {
    event_details: "Event Details", program: t.program, speaker: t.speaker,
    finalists: "Award", info: "Info", deadline: t.deadline,
  };
  return map[type] || type;
}

function EventDetailsBlock({ block, lang }: { block: Extract<CampaignBlock, { type: "event_details" }>; lang: Lang }) {
  const tl = T[lang];
  const formattedDate = block.date ? (() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(block.date)) {
      try { return new Date(block.date + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch { return block.date; }
    }
    return block.date;
  })() : null;
  const dateStr = formattedDate ? formattedDate + (block.time ? `, ${block.time}` : "") : block.time || null;

  return (
    <div>
      {block.category && <p style={{ color: D.gold, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px", fontFamily: "Arial,sans-serif" }}>{block.category}</p>}
      {block.event_title && <p style={{ color: D.navy, fontSize: 16, fontWeight: 700, margin: "0 0 14px", fontFamily: "Arial,sans-serif" }}>{block.event_title}</p>}
      <div style={{ borderTop: `1px solid ${D.gray2}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        {dateStr && <span style={{ color: D.black, fontSize: 14, fontFamily: "Arial,sans-serif" }}>{dateStr}</span>}
        {block.venue_name && <span style={{ color: D.black, fontSize: 14, fontFamily: "Arial,sans-serif" }}>{block.venue_name}</span>}
        {block.venue_address && <span style={{ color: D.gray, fontSize: 13, fontFamily: "Arial,sans-serif" }}>{block.venue_address}</span>}
        {block.moderation_name && (
          <div style={{ marginTop: 2 }}>
            <p style={{ color: D.gray, fontSize: 11, margin: "0 0 2px", letterSpacing: 1, fontFamily: "Arial,sans-serif" }}>{tl.moderation}</p>
            <span style={{ color: D.black, fontSize: 14, fontFamily: "Arial,sans-serif" }}>{block.moderation_name}</span>
            {block.moderation_title && <p style={{ color: D.gray, fontSize: 13, margin: "2px 0 0", fontFamily: "Arial,sans-serif" }}>{block.moderation_title}</p>}
          </div>
        )}
      </div>
      {block.date && (
        <div style={{ borderTop: `1px solid ${D.gray2}`, marginTop: 14, paddingTop: 14, display: "flex", gap: 16 }}>
          {block.venue_address && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.venue_address)}`}
              style={{ display: "flex", alignItems: "center", gap: 6, color: D.gold, fontSize: 13, fontWeight: 400, textDecoration: "none", fontFamily: "Arial,sans-serif" }}>
              Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramBlockEl({ block }: { block: Extract<CampaignBlock, { type: "program" }> }) {
  return (
    <div>
      {block.slots.map((slot, si) => (
        <div key={slot.id} style={{ padding: "14px 0", borderBottom: si < block.slots.length - 1 ? `1px solid ${D.gray2}` : "none" }}>
          <p style={{ color: D.navy, fontSize: 12, fontWeight: 700, margin: "0 0 4px", fontFamily: "Arial,sans-serif" }}>{slot.time}</p>
          <p style={{ color: D.black, fontSize: 15, fontWeight: 400, margin: 0, fontFamily: "Arial,sans-serif" }}>{slot.title}</p>
          {slot.sub_items.filter(s => s.title).map((sub, i) => (
            <div key={sub.id || i} style={{ marginTop: 8, paddingLeft: 12, borderLeft: `3px solid ${D.gold}` }}>
              <p style={{ color: D.black, fontSize: 14, fontWeight: 600, margin: 0, fontFamily: "Arial,sans-serif" }}>{sub.title}</p>
              {sub.speaker && <p style={{ color: D.gray, fontSize: 13, margin: 0, fontFamily: "Arial,sans-serif" }}>{sub.speaker}</p>}
            </div>
          ))}
          {slot.note && <p style={{ color: D.gray, fontSize: 13, marginTop: 8, marginBottom: 0, fontFamily: "Arial,sans-serif" }}>{slot.note}</p>}
        </div>
      ))}
    </div>
  );
}

function FinalistsBlockEl({ block }: { block: Extract<CampaignBlock, { type: "finalists" }> }) {
  return (
    <div>
      {block.title && <p style={{ color: D.navy, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "Arial,sans-serif" }}>{block.title}</p>}
      {block.intro && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, marginBottom: 12, fontFamily: "Arial,sans-serif" }}>{block.intro}</p>}
      {block.items.filter(f => f.name).map((item, i) => (
        <div key={item.id || i} style={{ padding: "10px 0 10px 12px", borderLeft: `3px solid ${D.gold}`, marginBottom: 8 }}>
          <p style={{ color: D.black, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "Arial,sans-serif" }}>{item.name}</p>
          {item.category && <p style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: 0, fontFamily: "Arial,sans-serif" }}>{item.category}</p>}
          {item.description && <p style={{ color: D.gray, fontSize: 14, lineHeight: 1.6, margin: 0, fontFamily: "Arial,sans-serif" }}>{item.description}</p>}
        </div>
      ))}
      {block.website_url && (
        <a href={block.website_url} style={{ display: "block", color: D.navy, textDecoration: "none", padding: "14px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", border: `2px solid ${D.navy}`, marginBottom: 16, fontFamily: "Arial,sans-serif" }}>
          {block.website_label || block.website_url}
        </a>
      )}
    </div>
  );
}

function SpeakerBlockEl({ block }: { block: Extract<CampaignBlock, { type: "speaker" }> }) {
  return (
    <div>
      {block.photo_url && <img src={block.photo_url} alt={block.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${D.gold}`, marginBottom: 12, display: "block" }} />}
      <p style={{ color: D.navy, fontSize: 16, fontWeight: 700, margin: "0 0 2px", fontFamily: "Arial,sans-serif" }}>{block.name}</p>
      {block.title && <p style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Arial,sans-serif" }}>{block.title}</p>}
      {block.book && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: "0 0 8px", fontFamily: "Arial,sans-serif" }}>{block.book}</p>}
      {block.bio && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: 0, fontFamily: "Arial,sans-serif" }}>{block.bio}</p>}
    </div>
  );
}

function InfoBlockEl({ block }: { block: Extract<CampaignBlock, { type: "info" }> }) {
  return (
    <div style={{ background: "#f5f5f5", padding: "16px 18px", borderRadius: 6 }}>
      {block.title && <p style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Arial,sans-serif" }}>{block.title}</p>}
      <RichHtml html={block.content} />
    </div>
  );
}

function DeadlineBlockEl({ block, lang }: { block: Extract<CampaignBlock, { type: "deadline" }>; lang: Lang }) {
  const formatted = block.date
    ? new Date(block.date + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
    : "–";
  return (
    <div style={{ padding: "10px 0" }}>
      <p style={{ color: D.gray, fontSize: 13, margin: 0, fontFamily: "Arial,sans-serif" }}>
        {T[lang].deadline}: <span style={{ color: D.black, fontWeight: 500 }}>{formatted}</span>
      </p>
    </div>
  );
}

function RegisterButtonEl({ block, registerUrl, lang }: { block: Extract<CampaignBlock, { type: "register_button" }>; registerUrl?: string; lang: Lang }) {
  const url = registerUrl || block.url || "#";
  const deadlineFormatted = block.deadline
    ? new Date(block.deadline + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div style={{ margin: "24px 0" }}>
      <a href={url} style={{ display: "block", background: D.gold, color: "#fff", textDecoration: "none", padding: "17px 32px", borderRadius: 14, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", fontFamily: "Arial,sans-serif" }}>
        {T[lang].registerBtn}
      </a>
      {deadlineFormatted && <p style={{ color: D.gray, fontSize: 13, textAlign: "center", margin: "10px 0 0", fontFamily: "Arial,sans-serif" }}>{T[lang].deadline}: {deadlineFormatted}</p>}
    </div>
  );
}

export function EmailBlocksRenderer({ blocks, lang = "en", registerUrl }: {
  blocks: CampaignBlock[];
  lang?: Lang;
  registerUrl?: string;
}) {
  const t = T[lang];
  return (
    <div>
      {blocks.map((block, i) => {
        const needsSectionHead = block.type !== "intro" && block.type !== "text" && block.type !== "info" && block.type !== "divider" && block.type !== "register_button" && block.type !== "deadline";
        return (
          <div key={i} style={{ marginTop: 24 }}>
            {needsSectionHead && (
              <>
                <Divider />
                <SectionHead label={block.type === "program" ? ((block as ProgramBlock).title || block.label || t.program) : (block.label || labelFor(block.type, t))} />
              </>
            )}
            {block.type === "intro" && <RichHtml html={block.text} />}
            {block.type === "event_details" && <EventDetailsBlock block={block} lang={lang} />}
            {block.type === "program" && <ProgramBlockEl block={block} />}
            {block.type === "finalists" && <FinalistsBlockEl block={block} />}
            {block.type === "speaker" && <SpeakerBlockEl block={block} />}
            {block.type === "text" && <RichHtml html={block.content} />}
            {block.type === "info" && <InfoBlockEl block={block} />}
            {block.type === "deadline" && <DeadlineBlockEl block={block} lang={lang} />}
            {block.type === "divider" && <Divider />}
            {block.type === "register_button" && <RegisterButtonEl block={block} registerUrl={registerUrl} lang={lang} />}
          </div>
        );
      })}
    </div>
  );
}
