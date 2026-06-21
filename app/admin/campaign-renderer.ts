// Server-safe renderer — no "use client", no React imports
import { type Lang, DATE_LOCALE, T } from "./i18n";

// ── Block type definitions ────────────────────────────────────────────────────

export type IntroBlock = { type: "intro"; text: string };

export type EventDetailsBlock = {
  type: "event_details";
  category: string;
  event_title: string;
  date: string;
  time: string;
  venue_name: string;
  venue_maps_url: string;
};

export type Speaker = {
  id: string;
  photo_url: string;
  name: string;
  title: string;
  bio: string;
  book: string;
  link_url?: string;
};

export type ModerationBlock = {
  type: "moderation";
  name: string;
  title: string;
};

export type ProgramSlot = {
  id: string;
  time: string;
  title: string;
  sub_items: { id: string; title: string; speaker: string }[];
  note: string;
  is_break?: boolean;
};

export type ProgramBlock = { type: "program"; title?: string; slots: ProgramSlot[] };

export type Finalist = { id: string; name: string; category: string; description: string };

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
  speakers: Speaker[];
};

export type TextBlock = { type: "text"; content: string };
export type InfoBlock = { type: "info"; title: string; content: string };
export type DeadlineBlock = { type: "deadline"; date: string };
export type DividerBlock = { type: "divider" };
export type RegisterButtonBlock = { type: "register_button"; url: string; deadline?: string };

export type CustomField = { id: string; label: string; value: string };

export type CampaignBlock = (
  | IntroBlock
  | EventDetailsBlock
  | ModerationBlock
  | ProgramBlock
  | FinalistsBlock
  | SpeakerBlock
  | TextBlock
  | InfoBlock
  | DeadlineBlock
  | DividerBlock
  | RegisterButtonBlock
) & { label?: string; custom_fields?: CustomField[] };

// ── HTML renderer ─────────────────────────────────────────────────────────────

const D = { navy: "#1E3263", gold: "#D28D28", black: "#1a1a1a", gray: "#6b7280", gray2: "#e8e8e8" };

function dividerHtml() {
  return `<div style="height:1px;background:${D.gray2};margin:20px 0;"></div>`;
}

function sectionHeadHtml(label: string) {
  return `<p style="color:#6b7280;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;font-family:Arial,sans-serif;">${label}</p>`;
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

export function richHtmlToEmail(html: string, color: string): string {
  if (!html || html === "<p></p>") return "";
  return html
    .replace(/<p( [^>]*)?>/g, (_, attrs) => `<p${attrs ?? ""} style="color:${color};font-size:15px;line-height:1.75;margin:0 0 14px;font-family:Arial,sans-serif;">`)
    .replace(/<ul>/g, `<ul style="color:${color};font-size:15px;line-height:1.75;margin:0 0 14px;padding-left:20px;list-style-type:disc;font-family:Arial,sans-serif;">`)
    .replace(/<ol>/g, `<ol style="color:${color};font-size:15px;line-height:1.75;margin:0 0 14px;padding-left:20px;font-family:Arial,sans-serif;">`)
    .replace(/<li>/g, `<li style="margin-bottom:4px;">`)
    .replace(/<strong>/g, `<strong style="font-weight:700;">`)
    .replace(/<em>/g, `<em style="font-style:italic;">`)
    .replace(/<a href="([^"]+)"[^>]*>/g, `<a href="$1" style="color:#D28D28;text-decoration:underline;">`);
}

function renderBlock(block: CampaignBlock, ctx?: { campaignId?: string; appUrl?: string; lang?: Lang; registerUrl?: string }): string {
  const t = T[ctx?.lang ?? "en"];
  const extra = renderCustomFields(block);
  switch (block.type) {
    case "intro":
      return `<div style="line-height:1.75;font-size:15px;color:${D.black};font-family:Arial,sans-serif;">${richHtmlToEmail(block.text, D.black)}</div>`;

    case "event_details": {
      const locale = DATE_LOCALE[ctx?.lang ?? "en"];
      const formattedDate = block.date
        ? (() => { try { const d = new Date(block.date + "T12:00:00"); if (isNaN(d.getTime())) return block.date; return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch { return block.date; } })()
        : "";
      const dateStr = formattedDate + (block.time ? `, ${block.time}` : "");

      const lines: string[] = [];
      if (block.category)
        lines.push(`<p style="color:${D.gold};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;font-family:Arial,sans-serif;">${block.category}</p>`);
      if (block.event_title)
        lines.push(`<p style="color:${D.navy};font-size:16px;font-weight:700;margin:0 0 14px;font-family:Arial,sans-serif;">${block.event_title}</p>`);

      const calMapsLinks: string[] = [];
      if (block.date && ctx?.campaignId && ctx?.appUrl)
        calMapsLinks.push(`<a href="${ctx.appUrl}/api/campaigns/${ctx.campaignId}/ics" style="color:${D.gold};font-size:13px;font-weight:400;text-decoration:none;font-family:Arial,sans-serif;">${t.addToCalendar}</a>`);
      if (block.venue_maps_url)
        calMapsLinks.push(`<a href="${block.venue_maps_url}" style="color:${D.gold};font-size:13px;font-weight:400;text-decoration:none;font-family:Arial,sans-serif;">Maps</a>`);

      const boxLines: string[] = [];
      if (dateStr) boxLines.push(`<p style="color:${D.black};font-size:14px;font-weight:700;margin:0 0 6px;font-family:Arial,sans-serif;">${dateStr}</p>`);
      if (block.venue_name) boxLines.push(`<p style="color:${D.black};font-size:14px;margin:0;font-family:Arial,sans-serif;">${block.venue_name}</p>`);

      return `${dividerHtml()}
${sectionHeadHtml(block.label || "Event Details")}
${lines.join("\n")}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
<tr><td style="background:#faf8f4;padding:12px 16px;border-left:3px solid ${D.gold};">
${boxLines.join("\n")}
</td></tr>
</table>
${calMapsLinks.length ? `<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>${calMapsLinks.map(l => `<td style="padding-right:20px;">${l}</td>`).join("")}</tr></table>` : ""}
${extra}`;
    }

    case "program": {
      const slotHtmls = block.slots.map((slot, i) => {
        const isFirst = i === 0;
        const isLast = i === block.slots.length - 1;
        const pad = isFirst ? "0 0 14px" : isLast ? "14px 0 0" : "14px 0";
        const subItems = slot.sub_items.filter(s => s.title);
        if (slot.is_break) {
          return `<tr><td style="padding:${pad};background:#faf9f2;text-align:center;">
  <p style="color:${D.navy};font-size:12px;font-weight:700;margin:0 0 4px;text-align:center;font-family:Arial,sans-serif;">${slot.time}</p>
  <p style="color:${D.black};font-size:15px;margin:0;text-align:center;font-family:Arial,sans-serif;">${slot.title}</p>
</td></tr>`;
        }
        return `<tr><td style="padding:${pad};">
  <p style="color:${D.navy};font-size:12px;font-weight:700;margin:0 0 4px;font-family:Arial,sans-serif;">${slot.time}</p>
  <p style="color:${D.black};font-size:15px;font-weight:400;margin:0${subItems.length ? " 0 16px" : ""};font-family:Arial,sans-serif;">${slot.title}</p>
  ${subItems.length ? `<table width="100%" cellpadding="0" cellspacing="0">
    ${subItems.map(s => `<tr><td style="padding:10px 0 10px 16px;border-left:3px solid ${D.gold};">
      <p style="color:${D.black};font-size:14px;font-weight:600;margin:0 0 2px;font-family:Arial,sans-serif;">${s.title}</p>
      ${s.speaker ? `<p style="color:${D.gray};font-size:13px;margin:0;font-family:Arial,sans-serif;">${s.speaker}</p>` : ""}
    </td></tr>`).join("\n")}
  </table>` : ""}
  ${slot.note?.trim() ? `<p style="color:${D.gray};font-size:13px;margin:12px 0 0;font-family:Arial,sans-serif;">${slot.note}</p>` : ""}
</td></tr>`;
      });
      return `${dividerHtml()}
${sectionHeadHtml(block.title || block.label || t.program)}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
${slotHtmls.join("\n")}
</table>${extra}`;
    }

    case "finalists": {
      const items = block.items.filter(f => f.name);
      return `${dividerHtml()}
${sectionHeadHtml(block.label || "Award")}
${block.title ? `<p style="color:${D.navy};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;font-family:Arial,sans-serif;">${block.title}</p>` : ""}
${block.intro ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 24px;font-family:Arial,sans-serif;">${block.intro}</p>` : ""}
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

    case "speaker": {
      const legacyBlock = block as unknown as Record<string, string>;
      const speakers = block.speakers ?? [{ id: "legacy", photo_url: legacyBlock.photo_url ?? "", name: legacyBlock.name ?? "", title: legacyBlock.title ?? "", bio: legacyBlock.bio ?? "", book: legacyBlock.book ?? "" }];
      const speakerHtmls = speakers.map((sp, i) => `${i > 0 ? `<div style="height:1px;background:${D.gray2};margin:20px 0;"></div>` : ""}
${sp.photo_url ? `<img src="${sp.photo_url}" alt="${sp.name}" width="100" style="display:block;width:100px;height:100px;object-fit:cover;border-radius:50%;border:3px solid ${D.gold};margin:0 0 16px;" />` : ""}
<p style="color:${D.navy};font-size:16px;font-weight:700;margin:0 0 3px;font-family:Arial,sans-serif;">${sp.name}</p>
${sp.title ? `<p style="color:${D.gold};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px;font-family:Arial,sans-serif;">${sp.title}</p>` : ""}
${sp.book?.trim() ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 10px;font-family:Arial,sans-serif;">${sp.book}</p>` : ""}
${sp.bio ? `<p style="color:${D.black};font-size:15px;line-height:1.75;margin:0 0 12px;font-family:Arial,sans-serif;">${sp.bio}</p>` : ""}
${sp.link_url?.trim() ? `<p style="text-align:right;margin:8px 0 0;"><a href="${sp.link_url}" style="display:inline-block;background:${D.gold};color:#ffffff;text-decoration:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;font-family:Arial,sans-serif;">${t.moreInfo}</a></p>` : ""}`);
      return `${sectionHeadHtml(block.label || t.speaker)}
${speakerHtmls.join("\n")}${extra}`;
    }

    case "moderation":
      return `${sectionHeadHtml(block.label || t.moderation)}
<p style="color:${D.black};font-size:15px;font-weight:600;margin:0 0 2px;font-family:Arial,sans-serif;">${block.name}</p>
${block.title?.trim() ? `<p style="color:${D.gray};font-size:13px;margin:0;font-family:Arial,sans-serif;">${block.title}</p>` : ""}${extra}`;

    case "text":
      return richHtmlToEmail(block.content, D.black);

    case "info": {
      const body = richHtmlToEmail(block.content, D.black);
      if (!body && !block.title) return "";
      return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">
<tr><td style="padding:20px 24px;background:#f5f5f5;border-radius:6px;">
${block.title ? `<p style="color:${D.gray};font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif;">${block.title}</p>` : ""}
${body}
</td></tr></table>`;
    }

    case "deadline": {
      const formatted = block.date
        ? new Date(block.date + 'T12:00:00').toLocaleDateString(DATE_LOCALE[ctx?.lang ?? "en"], { day: "numeric", month: "long", year: "numeric" })
        : "–";
      return `<p style="color:${D.gray};font-size:13px;margin:0 0 20px;font-family:Arial,sans-serif;">${t.deadline}: <span style="color:${D.black};font-weight:500;">${formatted}</span></p>`;
    }

    case "divider":
      return dividerHtml();

    case "register_button": {
      const url = ctx?.registerUrl || block.url || "#";
      const deadlineFormatted = block.deadline
        ? new Date(block.deadline + 'T12:00:00').toLocaleDateString(DATE_LOCALE[ctx?.lang ?? "en"], { day: "numeric", month: "long", year: "numeric" })
        : null;
      return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td>
    <a href="${url}" style="display:block;background:${D.gold};color:#ffffff;text-decoration:none;padding:17px 32px;border-radius:14px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;font-family:Arial,sans-serif;">
      ${t.registerBtn}
    </a>
  </td></tr>
  ${deadlineFormatted ? `<tr><td style="padding-top:10px;text-align:center;"><p style="color:${D.gray};font-size:13px;margin:0;font-family:Arial,sans-serif;">${t.deadline}: ${deadlineFormatted}</p></td></tr>` : ""}
</table>`;
    }
  }
}

export function renderBlocksToHtml(blocks: CampaignBlock[], ctx?: { campaignId?: string; appUrl?: string; lang?: Lang; registerUrl?: string }): string {
  const r = (b: CampaignBlock) => renderBlock(b, ctx);
  const hasRegisterBlock = blocks.some(b => b.type === "register_button");
  if (hasRegisterBlock) return blocks.map(r).join("\n\n");

  const introIdx = blocks.findIndex(b => b.type === "intro");
  if (introIdx === -1) return blocks.map(r).join("\n\n");

  const before = blocks.slice(0, introIdx + 1).map(r).join("\n\n");
  const after = blocks.slice(introIdx + 1).map(r).join("\n\n");
  return `${before}\n\n<!-- CTA -->\n\n${after}`;
}
