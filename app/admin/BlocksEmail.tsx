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

function sanitizeHtml(raw: string): string {
  // Strip dangerous tags and event attributes before rendering
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
}

function RichContent({ html }: { html: string }) {
  if (!html || html === "<p></p>") return null;
  // Inject inline styles into the HTML tags
  const styled = sanitizeHtml(html)
    .replace(/<p( [^>]*)?>/g, (_, attrs) => `<p${attrs ?? ""} style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;font-family:Arial,sans-serif;">`)
    .replace(/<ul>/g, `<ul style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;padding-left:20px;list-style-type:disc;font-family:Arial,sans-serif;">`)
    .replace(/<ol>/g, `<ol style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 14px;padding-left:20px;font-family:Arial,sans-serif;">`)
    .replace(/<li>/g, `<li style="margin-bottom:4px;">`)
    .replace(/<strong>/g, `<strong style="font-weight:700;">`)
    .replace(/<em>/g, `<em style="font-style:italic;">`)
    .replace(/<a href="([^"]+)"[^>]*>/g, `<a href="$1" style="color:${D.gold};text-decoration:underline;">`);
  return <div style={{ lineHeight: 1.75, fontSize: 15, color: D.black, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }} dangerouslySetInnerHTML={{ __html: styled }} />;
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
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 14 }}>
            <tbody><tr><td style={{ background: "#faf8f4", padding: "12px 16px", borderLeft: `3px solid ${D.gold}` }}>
              {formattedDate && <p style={{ color: D.black, fontSize: 14, fontWeight: 700, margin: "0 0 6px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{formattedDate}</p>}
              {block.venue_name && <p style={{ color: D.black, fontSize: 14, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.venue_name}</p>}
            </td></tr></tbody>
          </table>
          {(block.date || block.venue_maps_url) && (
            <table cellPadding={0} cellSpacing={0} style={{ marginBottom: 24 }}><tbody><tr>
              {block.date && campaignId && appUrl && (
                <td style={{ paddingRight: 20 }}>
                  <a href={`${appUrl}/api/campaigns/${campaignId}/ics`} style={{ color: D.gold, fontSize: 13, fontWeight: 400, textDecoration: "none", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{t.addToCalendar}</a>
                </td>
              )}
              {block.venue_maps_url && (
                <td>
                  <a href={block.venue_maps_url} style={{ color: D.gold, fontSize: 13, fontWeight: 400, textDecoration: "none", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>Maps</a>
                </td>
              )}
            </tr></tbody></table>
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
            <div key={slot.id} style={{ padding: slot.is_break ? 0 : (si === 0 ? "0 0 14px" : "14px 0"), borderBottom: si < block.slots.length - 1 && !slot.is_break && !block.slots[si + 1]?.is_break ? `1px solid ${D.gray2}` : "none" }}>
              {slot.is_break ? (
                <div style={{ background: "#faf8f4", padding: "14px 0", textAlign: "center" }}>
                  {slot.time?.trim() && <p style={{ color: D.navy, fontSize: 12, fontWeight: 700, margin: "0 0 4px", textAlign: "center", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.time}</p>}
                  {slot.title?.trim() && <p style={{ color: D.black, fontSize: 15, margin: 0, textAlign: "center", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.title}</p>}
                </div>
              ) : (
                <>
                  {slot.time?.trim() && <p style={{ color: D.navy, fontSize: 12, fontWeight: 700, margin: "0 0 4px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.time}</p>}
                  {slot.title?.trim() && <p style={{ color: D.black, fontSize: 15, fontWeight: 400, margin: slot.sub_items.filter(s => s.title).length ? "0 0 16px" : 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{slot.title}</p>}
                  {slot.sub_items.filter(s => s.title).map(sub => (
                    <div key={sub.id} style={{ marginTop: 10, marginBottom: 10, paddingTop: 10, paddingBottom: 10, paddingLeft: 12, borderLeft: `3px solid ${D.gold}` }}>
                      <p style={{ color: D.black, fontSize: 14, fontWeight: 600, margin: "0 0 3px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sub.title}</p>
                      {sub.speaker && <p style={{ color: D.gray, fontSize: 13, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sub.speaker}</p>}
                    </div>
                  ))}
                  {slot.note?.trim() && <p style={{ color: D.gray, fontSize: 13, margin: "12px 0 0", fontFamily: "'Helvetice Neue',Helvetica,Arial,sans-serif" }}>{slot.note}</p>}
                </>
              )}
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
          {(block.speakers ?? [(block as unknown as Record<string,unknown>)].map(b => ({ id: "legacy", photo_url: (b as Record<string,string>).photo_url ?? "", name: (b as Record<string,string>).name ?? "", title: (b as Record<string,string>).title ?? "", bio: (b as Record<string,string>).bio ?? "", book: (b as Record<string,string>).book ?? "" }))).map((sp, i) => (
            <div key={sp.id} style={i > 0 ? { borderTop: `1px solid ${D.gray2}`, marginTop: 20, paddingTop: 20 } : {}}>
              {sp.photo_url && <img src={sp.photo_url} alt={sp.name} width={80} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${D.gold}`, marginBottom: 12, display: "block" }} />}
              <p style={{ color: D.navy, fontSize: 16, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sp.name}</p>
              {sp.title && <p style={{ color: D.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 4px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sp.title}</p>}
              {sp.book?.trim() && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: "0 0 8px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sp.book}</p>}
              {sp.bio && <p style={{ color: D.black, fontSize: 15, lineHeight: 1.75, margin: "0 0 12px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sp.bio}</p>}
              {sp.link_url?.trim() && <p style={{ textAlign: "right", margin: "8px 0 0" }}><a href={sp.link_url} style={{ display: "inline-block", background: D.gold, color: "#ffffff", textDecoration: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{sp.link_label?.trim() || t.moreInfo}</a></p>}
            </div>
          ))}
          <CustomFields block={block} />
        </div>
      );

    case "moderation":
      return (
        <div>
          <Divider />
          <SectionHead label={block.label || t.moderation} />
          <p style={{ color: D.black, fontSize: 15, fontWeight: 600, margin: "0 0 2px", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.name}</p>
          {block.title?.trim() && <p style={{ color: D.gray, fontSize: 13, margin: 0, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{block.title}</p>}
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
