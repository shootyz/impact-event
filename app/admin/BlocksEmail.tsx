// Pure server-safe React component — no "use client", no hooks
// Renders blocks with IDENTICAL styles to PreviewPanel for use with renderToStaticMarkup
import React from "react";
import type { CampaignBlock, ProgramBlock, RegisterButtonBlock } from "./CampaignBuilder";
import { type Lang, T, DATE_LOCALE } from "./i18n";

import { D } from "./email-design";

function SectionHead({ label }: { label: string }) {
  return (
    <p style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 16px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      {label}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: D.gray2, margin: "20px 0" }} />;
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

function CustomFields({ block }: { block: CampaignBlock }) {
  const fields = (block.custom_fields ?? []).filter(f => f.label || f.value);
  if (!fields.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      {fields.map(f => (
        <div key={f.id} style={{ padding: "10px 0", borderTop: `1px solid ${D.gray2}` }}>
          <p style={{ color: D.navy, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 3px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{f.label}</p>
          <p style={{ color: D.black, fontSize: 15, fontWeight: 600, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{f.value}</p>
        </div>
      ))}
    </div>
  );
}

function RichContent({ html }: { html: string }) {
  if (!html || html === "<p></p>") return null;
  // Inject inline styles into the HTML tags
  const styled = html
    .replace(/<p>/g, `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;font-family:Arial,sans-serif;">`)
    .replace(/<ul>/g, `<ul style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;padding-left:20px;list-style-type:disc;font-family:Arial,sans-serif;">`)
    .replace(/<ol>/g, `<ol style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;padding-left:20px;font-family:Arial,sans-serif;">`)
    .replace(/<li>/g, `<li style="margin-bottom:4px;">`)
    .replace(/<strong>/g, `<strong style="font-weight:700;">`)
    .replace(/<em>/g, `<em style="font-style:italic;">`)
    .replace(/<a href="([^"]+)"[^>]*>/g, `<a href="$1" style="color:${D.gold};text-decoration:underline;">`);
  return <div dangerouslySetInnerHTML={{ __html: styled }} />;
}

function BlockRenderer({ block, lang, campaignId, appUrl, registerUrl }: {
  block: CampaignBlock;
  lang: Lang;
  campaignId?: string;
  appUrl?: string;
  registerUrl?: string;
}) {
  const t = T[lang];

  switch (block.type) {
    case "intro":
      return <RichContent html={block.text} />;

    case "event_details": {
      const formattedDate = block.date ? (() => {
        try {
          const d = new Date(block.date + "T12:00:00");
          if (isNaN(d.getTime())) return block.date;
          return d.toLocaleDateString(DATE_LOCALE[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        } catch { return block.date; }
      })() + (block.time ? `, ${block.time}` : "") : null;

      return (
        <div>
          <Divider />
          <SectionHead label={block.label || "Event Details"} />
          {block.category && <p style={{ color: D.gold, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.category}</p>}
          {block.event_title && <p style={{ color: D.navy, fontSize: 16, fontWeight: 700, margin: "0 0 14px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.event_title}</p>}
          <div style={{ borderTop: `1px solid ${D.gray2}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {formattedDate && <span style={{ color: D.black, fontSize: 14, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{formattedDate}</span>}
            {block.venue_name && <span style={{ color: D.black, fontSize: 14, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.venue_name}</span>}
            {block.venue_address && <span style={{ color: D.gray, fontSize: 13, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.venue_address}</span>}
            {block.moderation_name && (
              <div style={{ marginTop: 2 }}>
                <p style={{ color: D.gray, fontSize: 11, margin: "0 0 2px", letterSpacing: 1, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{t.moderation}</p>
                <span style={{ color: D.black, fontSize: 14, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.moderation_name}</span>
                {block.moderation_title && <p style={{ color: D.gray, fontSize: 13, margin: "2px 0 0", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.moderation_title}</p>}
              </div>
            )}
          </div>
          {(block.date || block.venue_address) && (
            <div style={{ borderTop: `1px solid ${D.gray2}`, marginTop: 14, paddingTop: 14 }}>
              {block.date && campaignId && appUrl && (
                <a href={`${appUrl}/api/campaigns/${campaignId}/ics`} style={{ color: D.gold, fontSize: 13, fontWeight: 400, textDecoration: "none", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
                  <span style={{ textDecoration: "none" }}>{t.addToCalendar}</span>
                </a>
              )}
              {block.date && campaignId && appUrl && block.venue_address && (
                <span style={{ color: D.gray2, fontSize: 13, margin: "0 8px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>·</span>
              )}
              {block.venue_address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.venue_address)}`} style={{ color: D.gold, fontSize: 13, fontWeight: 400, textDecoration: "none", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
                  <span style={{ textDecoration: "none" }}>Maps</span>
                </a>
              )}
            </div>
          )}
          <CustomFields block={block} />
        </div>
      );
    }

    case "program": {
      return (
        <div>
          <Divider />
          <SectionHead label={(block as ProgramBlock).title || block.label || t.program} />
          {block.slots.map((slot, si) => (
            <div key={slot.id} style={{ padding: "14px 0", borderBottom: si < block.slots.length - 1 ? `1px solid ${D.gray2}` : "none" }}>
              <p style={{ color: D.navy, fontSize: 12, fontWeight: 700, margin: "0 0 4px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.time}</p>
              <p style={{ color: D.black, fontSize: 15, fontWeight: 400, margin: slot.sub_items.filter(s => s.title).length ? "0 0 16px" : 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.title}</p>
              {slot.sub_items.filter(s => s.title).map(sub => (
                <div key={sub.id} style={{ marginTop: 8, paddingLeft: 12, borderLeft: `3px solid ${D.gold}` }}>
                  <p style={{ color: D.black, fontSize: 14, fontWeight: 600, margin: "0 0 2px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sub.title}</p>
                  {sub.speaker && <p style={{ color: D.gray, fontSize: 13, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sub.speaker}</p>}
                </div>
              ))}
              {slot.note && <p style={{ color: D.gray, fontSize: 13, margin: "12px 0 0", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.note}</p>}
            </div>
          ))}
          <CustomFields block={block} />
        </div>
      );
    }

    case "finalists": {
      return (
        <div>
          <Divider />
          <SectionHead label={block.label || labelFor(block.type)} />
          {block.title && <p style={{ color: D.navy, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 16px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.title}</p>}
          {block.intro && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: "0 0 24px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.intro}</p>}
          {block.items.filter(f => f.name).map(item => (
            <div key={item.id} style={{ padding: "10px 0 10px 12px", borderLeft: `3px solid ${D.gold}`, marginBottom: 8 }}>
              <p style={{ color: D.black, fontSize: 15, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{item.name}</p>
              {item.category && <p style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{item.category}</p>}
              {item.description && <p style={{ color: D.gray, fontSize: 14, lineHeight: 1.6, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{item.description}</p>}
            </div>
          ))}
          {block.video_url && (
            <a href={block.video_url} style={{ display: "block", background: D.gold, color: "#fff", textDecoration: "none", padding: "15px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", margin: "20px 0 8px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>Watch Award Video</a>
          )}
          {block.website_url && (
            <a href={block.website_url} style={{ display: "block", color: D.navy, textDecoration: "none", padding: "14px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", border: `2px solid ${D.navy}`, margin: "0 0 32px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.website_label || block.website_url}</a>
          )}
        </div>
      );
    }

    case "speaker":
      return (
        <div>
          <Divider />
          <SectionHead label={block.label || t.speaker} />
          {block.photo_url && (
            <img src={block.photo_url} alt={block.name} width={80} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${D.gold}`, marginBottom: 12, display: "block" }} />
          )}
          <p style={{ color: D.navy, fontSize: 16, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.name}</p>
          {block.title && <p style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.title}</p>}
          {block.book && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: "0 0 8px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.book}</p>}
          {block.bio && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.bio}</p>}
          <CustomFields block={block} />
        </div>
      );

    case "text":
      return <RichContent html={block.content} />;

    case "info": {
      const body = block.content && block.content !== "<p></p>" ? block.content : null;
      if (!body && !block.title) return null;
      return (
        <div style={{ background: "#f5f5f5", padding: "16px 18px", borderRadius: 6, margin: "0 0 20px" }}>
          {block.title && <p style={{ color: D.gray, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 12px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.title}</p>}
          {body && <RichContent html={body} />}
        </div>
      );
    }

    case "deadline": {
      const formatted = block.date
        ? new Date(block.date + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
        : "–";
      return (
        <div style={{ padding: "10px 0" }}>
          <p style={{ color: D.gray, fontSize: 13, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            {t.deadline}: <span style={{ color: D.black, fontWeight: 500 }}>{formatted}</span>
          </p>
        </div>
      );
    }

    case "divider":
      return <div style={{ height: 1, background: D.gray2, margin: "8px 0" }} />;

    case "register_button": {
      const url = registerUrl || block.url || "#";
      const formatted = block.deadline
        ? new Date(block.deadline + "T12:00:00").toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
        : null;
      return (
        <div style={{ margin: "16px 0" }}>
          <a href={url} style={{ display: "block", background: D.gold, color: "#fff", textDecoration: "none", textAlign: "center", padding: "14px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            {t.registerBtn}
          </a>
          {formatted && <p style={{ color: D.gray, fontSize: 13, textAlign: "center", margin: "8px 0 0", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{t.deadline}: {formatted}</p>}
        </div>
      );
    }

    default:
      return null;
  }
}

export default function BlocksEmail({ blocks, lang = "en", campaignId, appUrl, registerUrl }: {
  blocks: CampaignBlock[];
  lang?: Lang;
  campaignId?: string;
  appUrl?: string;
  registerUrl?: string;
}) {
  const hasRegisterBlock = blocks.some(b => b.type === "register_button");
  const introIdx = blocks.findIndex(b => b.type === "intro");

  const rendered = blocks.map((block, i) => (
    <div key={i} style={{ marginTop: i === 0 ? 0 : 24 }}>
      <BlockRenderer block={block} lang={lang} campaignId={campaignId} appUrl={appUrl} registerUrl={registerUrl} />
    </div>
  ));

  if (hasRegisterBlock || introIdx === -1) {
    return <>{rendered}</>;
  }

  // Insert CTA marker after intro for buildCampaignHtml to split on
  return (
    <>
      {rendered.slice(0, introIdx + 1)}
      {/* CTA */}
      {rendered.slice(introIdx + 1)}
    </>
  );
}
