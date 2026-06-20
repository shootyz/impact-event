"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import PreviewPanel from "./PreviewPanel";
import { type Lang, LANGUAGES, CATEGORIES, DATE_LOCALE, T, BLOCK_LABEL_TRANSLATIONS } from "./i18n";
export type { IntroBlock, EventDetailsBlock, ProgramSlot, ProgramBlock, Finalist, FinalistsBlock, SpeakerBlock, TextBlock, InfoBlock, DeadlineBlock, DividerBlock, RegisterButtonBlock, CustomField, CampaignBlock } from "./campaign-renderer";
export { renderBlocksToHtml, richHtmlToEmail } from "./campaign-renderer";
import type { IntroBlock, EventDetailsBlock, ProgramSlot, ProgramBlock, Finalist, FinalistsBlock, SpeakerBlock, TextBlock, InfoBlock, DeadlineBlock, DividerBlock, RegisterButtonBlock, CustomField, CampaignBlock } from "./campaign-renderer";
import { richHtmlToEmail, renderBlocksToHtml } from "./campaign-renderer";


// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getBlockLabel(type: CampaignBlock["type"], lang: Lang): string {
  return BLOCK_LABEL_TRANSLATIONS[lang][type] ?? type;
}

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

function RichTextEditor({ value, onChange, minHeight = 120 }: {
  value: string; onChange: (v: string) => void; minHeight?: number;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true })],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height:${minHeight}px;outline:none;font-size:15px;line-height:1.75;color:#1a1a1a;`,
      },
    },
  });

  // Sync external value changes (e.g. block load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;

  const btnBase: React.CSSProperties = { padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, border: "1px solid #d1d5db", background: "white", cursor: "pointer", color: "#374151" };
  const btnActive: React.CSSProperties = { ...btnBase, background: "#1E3263", color: "white", borderColor: "#1E3263" };

  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 4, padding: "6px 8px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", flexWrap: "wrap" }}>
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          style={editor.isActive("bold") ? btnActive : btnBase}>B</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          style={editor.isActive("italic") ? { ...btnActive, fontStyle: "italic" } : { ...btnBase, fontStyle: "italic" }}>I</button>
        <div style={{ width: 1, background: "#d1d5db", margin: "0 2px" }} />
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          style={editor.isActive("bulletList") ? btnActive : btnBase}>• Liste</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          style={editor.isActive("orderedList") ? btnActive : btnBase}>1. Liste</button>
        <div style={{ width: 1, background: "#d1d5db", margin: "0 2px" }} />
        <button type="button" onMouseDown={e => {
          e.preventDefault();
          if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
          const url = window.prompt("URL oder E-Mail eingeben:", "https://");
          if (!url) return;
          const href = url.includes("@") && !url.startsWith("http") ? `mailto:${url}` : url;
          editor.chain().focus().setLink({ href }).run();
        }} style={editor.isActive("link") ? btnActive : btnBase}>🔗 Link</button>
      </div>
      {/* Editor */}
      <div style={{ padding: "10px 12px", background: "white" }}>
        <style>{`
          .tiptap p { margin: 0 0 10px; }
          .tiptap p:last-child { margin-bottom: 0; }
          .tiptap ul { list-style-type: disc; padding-left: 20px; margin: 0 0 10px; }
          .tiptap ol { list-style-type: decimal; padding-left: 20px; margin: 0 0 10px; }
          .tiptap li { margin-bottom: 3px; }
          .tiptap a { color: #D28D28; text-decoration: underline; cursor: pointer; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function IntroEditor({ block, onChange }: { block: IntroBlock; onChange: (b: IntroBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls} style={labelSty}>Text</label>
        <RichTextEditor value={block.text} onChange={v => onChange({ ...block, text: v })} minHeight={120} />
        <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Register Now Button wird automatisch darunter eingefügt.</p>
      </div>
    </div>
  );
}

function EventDetailsEditor({ block, onChange, subject, lang = "en" }: { block: EventDetailsBlock; onChange: (b: EventDetailsBlock) => void; subject?: string; lang?: Lang }) {
  const t = T[lang];
  const cats = CATEGORIES[lang];
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
    return d.toLocaleDateString(DATE_LOCALE[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  const isCustom = block.category !== "" && !cats.includes(block.category);

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls} style={labelSty}>Kategorie</label>
        <select
          value={isCustom ? "__custom__" : block.category}
          onChange={e => onChange({ ...block, category: e.target.value === "__custom__" ? "" : e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", outline: "none" }}>
          <option value="">{t.selectCategory}</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__custom__">{t.customCategory}</option>
        </select>
        {(isCustom || block.category === "") && (block.category !== undefined) && (
          <input
            value={isCustom ? block.category : ""}
            onChange={e => onChange({ ...block, category: e.target.value })}
            placeholder={t.customCategory}
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
          onChange={e => onChange({ ...block, date: e.target.value })}
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
      {(["venue_name", "venue_address", "moderation_name", "moderation_title"] as const).map(k => (
        <div key={k}>
          <label className={labelCls} style={labelSty}>{
            k === "venue_name" ? "Venue Name" : k === "venue_address" ? "Adresse" :
            k === "moderation_name" ? "Moderation Name" : "Moderation Titel"
          }</label>
          <div className="flex flex-col gap-1">
            <FocusInput value={block[k]} onChange={v => onChange({ ...block, [k]: v })}
              placeholder={
                k === "venue_name" ? "Kirchgemeindehaus Gstaad" :
                k === "venue_address" ? "Untergstaadstrasse 8, 3780 Gstaad" :
                k === "moderation_name" ? "Carolin Roth" : "Business Moderator & Journalist"
              } />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramEditor({ block, onChange }: { block: ProgramBlock; onChange: (b: ProgramBlock) => void }) {
  const [titleFocus, setTitleFocus] = useState(false);
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
      <div>
        <label className={labelCls} style={labelSty}>Titel des Blocks</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition"
          style={{ ...inputSty, borderColor: titleFocus ? "#1E3263" : "#d1d5db" }}
          value={block.title ?? ""} onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="ZEITPLAN"
          onFocus={() => setTitleFocus(true)} onBlur={() => setTitleFocus(false)} />
      </div>
      {block.slots.map((slot, i) => (
        <div key={slot.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#e5e7eb", background: "#fafafa" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1E3263" }}>Slot {i + 1}</span>
            <button onClick={() => removeSlot(slot.id)} className="text-xs px-2 py-1 rounded transition active:scale-95 hover:opacity-70" style={{ color: "#dc2626" }}>Entfernen</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls} style={labelSty}>Zeit</label>
              <div className="flex items-center gap-2">
                <input type="time" value={slot.time?.split(" – ")[0] ?? ""}
                  onChange={e => {
                    const start = e.target.value;
                    const end = slot.time?.split(" – ")[1] ?? "";
                    updateSlot(slot.id, { time: end ? `${start} – ${end}` : start });
                  }}
                  className="rounded-lg border px-2 py-2 text-sm outline-none"
                  style={{ borderColor: "#d1d5db", background: "white", color: "#111", colorScheme: "light" }} />
                <span style={{ color: "#9ca3af", fontSize: 13 }}>–</span>
                <input type="time" value={slot.time?.split(" – ")[1] ?? ""}
                  onChange={e => {
                    const start = slot.time?.split(" – ")[0] ?? "";
                    const end = e.target.value;
                    updateSlot(slot.id, { time: end ? `${start} – ${end}` : start });
                  }}
                  className="rounded-lg border px-2 py-2 text-sm outline-none"
                  style={{ borderColor: "#d1d5db", background: "white", color: "#111", colorScheme: "light" }} />
              </div>
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
            <button onClick={() => addSubItem(slot.id)} className="text-xs px-3 py-1.5 rounded-lg border font-medium transition active:scale-95 hover:opacity-70" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
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
      <button onClick={addSlot} className="px-3 py-1.5 rounded-lg border text-xs font-medium transition active:scale-95 hover:opacity-70" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
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
            <button onClick={() => removeItem(f.id)} className="text-xs px-2 py-1 rounded transition active:scale-95 hover:opacity-70" style={{ color: "#dc2626" }}>Entfernen</button>
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
      <button onClick={addItem} className="px-3 py-1.5 rounded-lg border text-xs font-medium transition active:scale-95 hover:opacity-70" style={{ borderColor: "#d1d5db", color: "#6b7280" }}
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
      {block.book ? (
        <div>
          <label className={labelCls} style={labelSty}>Buch / Vortrag</label>
          <FocusInput value={block.book} onChange={v => onChange({ ...block, book: v })} placeholder="André will present his new book…" />
        </div>
      ) : (
        <button className="text-xs" style={{ color: "var(--ig-gray3)" }} onClick={() => onChange({ ...block, book: " " })}>+ Buch / Vortrag hinzufügen</button>
      )}
      <div>
        <label className={labelCls} style={labelSty}>Bio</label>
        <FocusInput multiline rows={3} value={block.bio} onChange={v => onChange({ ...block, bio: v })} placeholder="A groundbreaking work on how business leaders…" />
      </div>
    </div>
  );
}

function InfoEditor({ block, onChange }: { block: InfoBlock; onChange: (b: InfoBlock) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls} style={labelSty}>Titel</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition"
          style={{ ...inputSty, borderColor: focus ? "#1E3263" : "#d1d5db" }}
          value={block.title} onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="TRAVEL & PARKING"
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
      </div>
      <div>
        <label className={labelCls} style={labelSty}>Inhalt</label>
        <RichTextEditor value={block.content} onChange={v => onChange({ ...block, content: v })} minHeight={100} />
      </div>
    </div>
  );
}

function TextEditor({ block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void }) {
  return (
    <div>
      <label className={labelCls} style={labelSty}>Text</label>
      <RichTextEditor value={block.content} onChange={v => onChange({ ...block, content: v })} minHeight={96} />
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
            placeholder="Titel" className="rounded-lg border px-2 py-1.5 text-xs w-32 flex-shrink-0"
            style={{ borderColor: "#d1d5db", color: "#1E3263", outline: "none" }} />
          <input value={f.value} onChange={e => update(f.id, { value: e.target.value })}
            placeholder="Inhalt" className="flex-1 rounded-lg border px-2 py-1.5 text-xs"
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

function BlockCard({ block, index, total, onChange, onRemove, onMove, onDragStart, onDragOver, onDrop, isDragOver, subject, lang }: {
  block: CampaignBlock;
  index: number;
  total: number;
  onChange: (b: CampaignBlock) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragOver: boolean;
  subject?: string;
  lang?: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  function startRename(e: React.MouseEvent) {
    e.stopPropagation();
    setRenameVal(block.label || getBlockLabel(block.type, "de"));
    setRenaming(true);
    setTimeout(() => renameRef.current?.select(), 0);
  }
  function commitRename() {
    const trimmed = renameVal.trim();
    onChange({ ...block, label: trimmed && trimmed !== getBlockLabel(block.type, "de") ? trimmed : undefined });
    setRenaming(false);
  }

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      className="rounded-2xl border overflow-hidden transition-all"
      style={{ borderColor: isDragOver ? "#1E3263" : "#e5e7eb", opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ background: "#f9fafb", borderBottom: open ? "1px solid #e5e7eb" : "none" }}
        onClick={() => !renaming && setOpen(o => !o)}>
        <span style={{ cursor: "grab", color: "#9ca3af", fontSize: 16, lineHeight: 1 }} title="Ziehen zum Verschieben"
          onClick={e => e.stopPropagation()}>⠿</span>
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
            {block.label || getBlockLabel(block.type, "de")}
          </span>
        )}
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button disabled={index === 0} onClick={() => onMove(-1)}
            className="w-7 h-7 rounded-lg border text-xs font-bold transition active:scale-95 disabled:opacity-30 hover:opacity-80"
            style={{ borderColor: "#d1d5db", color: "#6b7280" }}>↑</button>
          <button disabled={index === total - 1} onClick={() => onMove(1)}
            className="w-7 h-7 rounded-lg border text-xs font-bold transition active:scale-95 disabled:opacity-30 hover:opacity-80"
            style={{ borderColor: "#d1d5db", color: "#6b7280" }}>↓</button>
          <button onClick={onRemove}
            className="w-7 h-7 rounded-lg border text-xs font-bold transition active:scale-95"
            style={{ borderColor: "#fecaca", color: "#dc2626" }}>✕</button>
        </div>
      </div>
      {/* Body */}
      {open && (
        <div className="p-4">
          {block.type === "intro" && <IntroEditor block={block} onChange={onChange as (b: IntroBlock) => void} />}
          {block.type === "event_details" && <EventDetailsEditor block={block} onChange={onChange as (b: EventDetailsBlock) => void} subject={subject} lang={lang} />}
          {block.type === "program" && <ProgramEditor block={block} onChange={onChange as (b: ProgramBlock) => void} />}
          {block.type === "finalists" && <FinalistsEditor block={block} onChange={onChange as (b: FinalistsBlock) => void} />}
          {block.type === "speaker" && <SpeakerEditor block={block} onChange={onChange as (b: SpeakerBlock) => void} />}
          {block.type === "info" && <InfoEditor block={block} onChange={onChange as (b: InfoBlock) => void} />}
          {block.type === "text" && <TextEditor block={block} onChange={onChange as (b: TextBlock) => void} />}
          {block.type === "deadline" && <DeadlineEditor block={block} onChange={onChange as (b: DeadlineBlock) => void} />}
          {block.type === "divider" && <p className="text-sm" style={{ color: "#9ca3af" }}>Horizontale Trennlinie</p>}
          {block.type === "register_button" && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "#9ca3af" }}>URL wird automatisch durch den gewählten Event gesetzt.</p>
              <div>
                <label className={labelCls} style={labelSty}>Anmeldeschluss <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={block.deadline ?? ""}
                  onChange={e => onChange({ ...block, deadline: e.target.value } as RegisterButtonBlock)}
                  className="rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "#d1d5db", background: "white", color: "#111", colorScheme: "light" }} />
              </div>
            </div>
          )}
          {block.type !== "divider" && block.type !== "register_button" && <CustomFieldsEditor block={block} onChange={onChange} />}
        </div>
      )}
    </div>
  );
}

// ── Add block menu ────────────────────────────────────────────────────────────

const ADDABLE_BLOCK_TYPES: { type: CampaignBlock["type"]; icon: string }[] = [
  { type: "intro", icon: "✍️" },
  { type: "event_details", icon: "📅" },
  { type: "program", icon: "📋" },
  { type: "finalists", icon: "🏆" },
  { type: "speaker", icon: "🎤" },
  { type: "text", icon: "📝" },
  { type: "info", icon: "ℹ️" },
  { type: "deadline", icon: "⏰" },
  { type: "register_button", icon: "🔗" },
  { type: "divider", icon: "—" },
];

function defaultBlock(type: CampaignBlock["type"]): CampaignBlock {
  switch (type) {
    case "intro": return { type, text: "" };
    case "event_details": return { type, category: "", event_title: "", date: "", time: "13:00", venue_name: "", venue_address: "", venue_maps_url: "", moderation_name: "", moderation_title: "" };
    case "program": return { type, slots: [{ id: uid(), time: "", title: "", sub_items: [], note: "" }] };
    case "finalists": return { type, title: "Green Business Award", intro: "", items: [{ id: uid(), name: "", category: "", description: "" }], video_url: "", website_url: "", website_label: "" };
    case "speaker": return { type, photo_url: "", name: "", title: "", bio: "", book: "" };
    case "text": return { type, content: "" };
    case "info": return { type, title: "", content: "" };
    case "deadline": return { type, date: "" };
    case "divider": return { type: "divider" };
    case "register_button": return { type: "register_button", url: "https://impactgstaad.vercel.app" };
  }
}

// ── Main CampaignBuilder ──────────────────────────────────────────────────────

export type ZielgruppeOption = { id: string; name: string };
export type EventOption = { id: string; name: string; date: string };

export default function CampaignBuilder({
  onSaveDraft,
  campaignId,
  initialSubject,
  initialTitle,
  initialBlocks,
  initialEventUrl,
  initialLang,
  zielgruppeId,
  onZielgruppeChange,
  zielgruppen,
  events,
}: {
  onSaveDraft: (subject: string, bodyHtml: string, eventUrl: string, blocks: CampaignBlock[], zielgruppeId: string | null, autoId?: string, isAutoSave?: boolean, lang?: Lang, title?: string) => Promise<string>;
  campaignId?: string;
  initialSubject?: string;
  initialTitle?: string;
  initialBlocks?: CampaignBlock[];
  initialEventUrl?: string;
  initialLang?: Lang;
  zielgruppeId: string | null;
  onZielgruppeChange: (id: string | null) => void;
  zielgruppen?: ZielgruppeOption[];
  events?: EventOption[];
}) {
  const [lang, setLang] = useState<Lang>(initialLang ?? "en");
  const [title, setTitle] = useState(initialTitle ?? "");
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [eventUrl, setEventUrl] = useState(() => {
    if (initialEventUrl) return initialEventUrl;
    if (events && events.length > 0) return `https://impactgstaad.vercel.app?event=${events[0].id}`;
    return "https://impactgstaad.vercel.app";
  });
  const setZielgruppeId = onZielgruppeChange;
  const [blocks, setBlocks] = useState<CampaignBlock[]>(
    initialBlocks && initialBlocks.length > 0 ? initialBlocks : [{ type: "intro", text: "" }]
  );
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const autoIdRef = useRef<string | undefined>(campaignId);
  const isDirtyRef = useRef(false);
  const firstSaveDoneRef = useRef(!!campaignId);
  const titleRef = useRef(title);
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
  const dropBlock = useCallback(() => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    setBlocks(prev => {
      const next = [...prev];
      const [item] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, item);
      return next;
    });
    setDragIdx(null); setOverIdx(null);
  }, [dragIdx, overIdx]);

  const bodyHtml = renderBlocksToHtml(blocks, { lang });
  const canSave = subject.trim() && blocks.length > 0;

  // Keep refs in sync so the interval always reads latest values
  useEffect(() => { titleRef.current = title; isDirtyRef.current = true; }, [title]);
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
        const id = await onSaveDraft(subjectRef.current, bodyHtmlRef.current, eventUrlRef.current, blocksRef.current, zielgruppeIdRef.current, autoIdRef.current, true, lang, titleRef.current);
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
        const id = await onSaveDraft(subjectRef.current, bodyHtmlRef.current, eventUrlRef.current, blocksRef.current, zielgruppeIdRef.current, autoIdRef.current, true, lang, titleRef.current);
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
    <div className="flex gap-0" style={{ height: "calc(100vh - 120px)", minHeight: 600 }}>
      {/* Left: live editable preview */}
      <div className="hidden lg:flex flex-col" style={{ width: "50%", borderRight: "1px solid #e5e7eb", overflowY: "auto", height: "100%" }}>
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "#e5e7eb", flexShrink: 0 }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#1E3263" }}>Vorschau</p>
        </div>
        <PreviewPanel blocks={blocks} subject={subject} onBlocks={setBlocks} lang={lang} eventUrl={eventUrl} />
      </div>

      {/* Right: editor */}
      <div className="flex-1 p-5 space-y-5" style={{ minWidth: 0, overflowY: "auto", height: "100%" }}>

        {/* Language toggle */}
        <div className="flex items-center gap-1">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className="px-3 py-1 rounded-lg text-xs font-bold tracking-widest transition active:scale-95"
              style={{
                background: lang === l.code ? "var(--ig-navy)" : "var(--ig-gray2)",
                color: lang === l.code ? "white" : "var(--ig-navy)",
              }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Campaign title */}
        <div>
          <label className={labelCls2} style={labelSty2}>Kampagnen-Titel <span style={{ color: "#9ca3af", fontWeight: 400 }}>(intern, nur für dich)</span></label>
          <input className={inputCls2} style={{ ...inputSty, borderColor: "#d1d5db" }} value={title}
            onChange={e => setTitle(e.target.value)} placeholder="z.B. Einladung Impact Circle Event Februar 2026"
            onFocus={e => e.currentTarget.style.borderColor = "#1E3263"}
            onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"} />
        </div>

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
                onDragStart={() => setDragIdx(i)}
                onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
                onDrop={dropBlock}
                isDragOver={overIdx === i && dragIdx !== i}
                subject={subject} lang={lang} />
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
                  {ADDABLE_BLOCK_TYPES.map(ab => (
                    <button key={ab.type} onClick={() => addBlock(ab.type)}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition active:scale-[0.99]"
                      style={{ color: "#111", borderBottom: "1px solid #f3f4f6" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
                      <span>{ab.icon}</span>
                      <span>{getBlockLabel(ab.type, "de")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Result */}
        {/* Save button + status */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs" style={{ color: result ? (result.ok ? "#16a34a" : "#dc2626") : "#9ca3af" }}>
            {result ? result.msg : autoSaveStatus ?? ""}
          </div>
          <button disabled={!canSave || saving}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition active:scale-95 disabled:opacity-40 hover:opacity-90"
            style={{ background: "#D28D28", color: "white" }}
            onClick={async () => {
              setSaving(true); setResult(null);
              isDirtyRef.current = false;
              const id = await onSaveDraft(subject, bodyHtml, eventUrl, blocks, zielgruppeId, autoIdRef.current, false, lang, title);
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
