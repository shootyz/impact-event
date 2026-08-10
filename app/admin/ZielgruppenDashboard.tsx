"use client";
import { useRef, useState } from "react";
import type { Zielgruppe, Member } from "@/lib/supabase";

const ANREDE_OPTIONS = ["", "Herr", "Frau", "Divers"];
const SPRACHE_OPTIONS = [
  { value: "de", label: "DE" },
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

const inputCls = "w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition";
const inputStyle = { borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", background: "white" };

// Reusable button classes
const btnPrimary = "transition hover:opacity-70 active:scale-95 disabled:opacity-40 font-semibold text-xs px-3 py-1.5 rounded-lg";
const btnSecondary = "transition hover:opacity-65 active:scale-95 text-xs px-3 py-1.5 rounded-lg";
const btnIcon = "transition hover:opacity-100 active:scale-95 p-2 rounded-lg min-w-11 min-h-11 flex items-center justify-center";

const IconPencilSmall = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const IconXSmall = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
);
const IconDownloadSmall = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
);

// Column header aliases, matched after stripping everything but letters/digits — so
// "Last Name", "last_name" and "Nachname" all normalize to the same key.
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
const HEADER_ALIASES: Record<"first_name" | "last_name" | "email" | "anrede" | "sprache", string[]> = {
  first_name: ["vorname", "firstname", "givenname", "forename", "prenom"],
  last_name: ["name", "nachname", "lastname", "surname", "familyname", "nom"],
  email: ["email", "mail", "emailadresse", "emailaddress", "courriel"],
  anrede: ["anrede", "salutation", "title", "titre", "anspracheform"],
  sprache: ["sprache", "language", "langue", "lang", "locale"],
};
// Free-text language values → canonical 2-letter code, so "Englisch"/"English"/"anglais" all become "en".
// Keys are already run through norm() (lowercased, diacritics stripped) — "französisch" → "franzosisch".
const SPRACHE_VALUE_ALIASES: Record<string, string> = {
  de: "de", deutsch: "de", german: "de", allemand: "de", ger: "de", deu: "de",
  en: "en", englisch: "en", english: "en", anglais: "en", eng: "en",
  fr: "fr", franzosisch: "fr", french: "fr", francais: "fr", fra: "fr",
};
function normalizeSprache(raw: string): string | null {
  const key = norm(raw);
  if (!key) return null;
  return SPRACHE_VALUE_ALIASES[key] ?? raw.toLowerCase().trim();
}

// Fallback for columns whose header doesn't match any known label at all: sniff the
// actual values. E-Mail and Anrede/Sprache have a fairly constrained shape, so this
// catches headers we never anticipated (e.g. "Nom de famille") without a code change.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SALUTATION_VALUES = new Set([
  "herr", "frau", "fraulein", "mr", "mrs", "ms", "miss", "mx",
  "monsieur", "madame", "mademoiselle", "mme", "mlle", "m", "dr", "prof",
]);
function detectColumnsByContent(
  sampleRows: string[][],
  numCols: number,
  claimed: Set<number>
): { email: number; anrede: number; sprache: number } {
  let email = -1, anrede = -1, sprache = -1;
  for (let c = 0; c < numCols; c++) {
    if (claimed.has(c)) continue;
    const vals = sampleRows.map(r => (r[c] ?? "").trim()).filter(Boolean);
    if (vals.length === 0) continue;
    if (email < 0 && vals.every(v => EMAIL_RE.test(v))) { email = c; claimed.add(c); continue; }
    if (anrede < 0 && vals.every(v => SALUTATION_VALUES.has(norm(v)))) { anrede = c; claimed.add(c); continue; }
    if (sprache < 0 && vals.every(v => ["de", "en", "fr"].includes(normalizeSprache(v) ?? ""))) { sprache = c; claimed.add(c); continue; }
  }
  return { email, anrede, sprache };
}

type EditingMember = {
  id: string; first_name: string; last_name: string;
  email: string; anrede: string; sprache: string;
};

type NewMember = { first_name: string; last_name: string; email: string; anrede: string; sprache: string };
const emptyNew = (): NewMember => ({ first_name: "", last_name: "", email: "", anrede: "", sprache: "de" });

type CsvRow = { first_name: string; last_name: string; email: string; anrede: string; sprache: string | null };
type CsvPreview = {
  zgId: string;
  file: File;
  rows: CsvRow[];
  detectedColumns: string[];
  missingColumns: string[];
};

type SortKey = "anrede" | "first_name" | "last_name" | "email" | "sprache";
type SortConfig = { key: SortKey; dir: "asc" | "desc" };

const IconSortUp = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
const IconSortDown = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
);

export default function ZielgruppenDashboard({
  zielgruppen, members, eventId, adminPassword,
  onMembersChange, onZielgruppeChange,
}: {
  zielgruppen: Zielgruppe[];
  members: Member[];
  eventId: string;
  adminPassword: string;
  onMembersChange: (members: Member[]) => void;
  onZielgruppeChange: (zielgruppen: Zielgruppe[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingMember | null>(null);
  const [newMember, setNewMember] = useState<NewMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [newZGName, setNewZGName] = useState("");
  const [creatingZG, setCreatingZG] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [zgDeleteConfirm, setZgDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [csvZgId, setCsvZgId] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ zgId: string; inserted: number } | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const [showUnsub, setShowUnsub] = useState<Record<string, boolean>>({});
  const csvRef = useRef<HTMLInputElement>(null);
  const [sortConfig, setSortConfig] = useState<Record<string, SortConfig>>({});
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ zgId: string; ids: string[]; label: string } | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [dragOverZg, setDragOverZg] = useState<string | null>(null);
  const [hsLists, setHsLists] = useState<{ id: string; name: string }[]>([]);
  const [hsLoading, setHsLoading] = useState(false);
  const [hsZgId, setHsZgId] = useState<string | null>(null);
  const [hsSelectedList, setHsSelectedList] = useState("");
  const [hsImporting, setHsImporting] = useState(false);
  const [hsResult, setHsResult] = useState<{ zgId: string; imported: number; duplicates: number } | null>(null);

  const groupMembers = (zgId: string) => {
    const q = (searchQuery[zgId] ?? "").toLowerCase().trim();
    const includeUnsub = showUnsub[zgId] ?? false;
    const list = members
      .filter(m => m.zielgruppe_id === zgId && (includeUnsub || !m.unsubscribed))
      .filter(m => !q || [m.first_name, m.last_name, m.email, m.anrede ?? ""].join(" ").toLowerCase().includes(q));
    const sort = sortConfig[zgId];
    if (!sort) return list;
    const sorted = [...list].sort((a, b) => {
      const av = (a[sort.key] ?? "").toString().toLowerCase();
      const bv = (b[sort.key] ?? "").toString().toLowerCase();
      const cmp = av.localeCompare(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  };

  const unsubCount = (zgId: string) => members.filter(m => m.zielgruppe_id === zgId && m.unsubscribed).length;

  function toggleSort(zgId: string, key: SortKey) {
    setSortConfig(prev => {
      const current = prev[zgId];
      const dir: "asc" | "desc" = current?.key === key && current.dir === "asc" ? "desc" : "asc";
      return { ...prev, [zgId]: { key, dir } };
    });
  }

  function toggleSelectOne(zgId: string, id: string) {
    setSelected(prev => {
      const set = new Set(prev[zgId] ?? []);
      if (set.has(id)) set.delete(id); else set.add(id);
      return { ...prev, [zgId]: set };
    });
  }

  function toggleSelectAll(zgId: string, ids: string[]) {
    setSelected(prev => {
      const set = prev[zgId] ?? new Set<string>();
      const allSelected = ids.length > 0 && ids.every(id => set.has(id));
      return { ...prev, [zgId]: allSelected ? new Set() : new Set(ids) };
    });
  }

  async function runBulkDelete() {
    if (!bulkDeleteConfirm) return;
    setBulkDeleting(true);
    await Promise.all(bulkDeleteConfirm.ids.map(id =>
      fetch("/api/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, adminPassword }) })
    ));
    const deletedIds = new Set(bulkDeleteConfirm.ids);
    onMembersChange(members.filter(m => !deletedIds.has(m.id)));
    setSelected(prev => ({ ...prev, [bulkDeleteConfirm.zgId]: new Set() }));
    setBulkDeleting(false);
    setBulkDeleteConfirm(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch(`/api/members/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, adminPassword }),
    });
    if (res.ok) {
      const d = await res.json();
      onMembersChange(members.map(m => m.id === d.id ? { ...m, ...d } : m));
      setEditing(null);
    }
    setSaving(false);
  }

  async function deleteMember(id: string) {
    await fetch("/api/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, adminPassword }) });
    onMembersChange(members.filter(m => m.id !== id));
    setSelected(prev => {
      const next: Record<string, Set<string>> = {};
      for (const [zgId, set] of Object.entries(prev)) {
        if (set.has(id)) { const copy = new Set(set); copy.delete(id); next[zgId] = copy; }
        else next[zgId] = set;
      }
      return next;
    });
  }

  async function addMember(zgId: string) {
    if (!newMember) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: [newMember], zielgruppe_id: zgId, event_id: eventId, adminPassword }),
      });
      const d = await res.json();
      if (!res.ok) {
        setAddError(d.error ?? `Fehler ${res.status}`);
      } else {
        const updated = await fetch(`/api/members?eventId=${eventId}`, { headers: { "Authorization": `Bearer ${adminPassword}` } }).then(r => r.json());
        if (Array.isArray(updated)) onMembersChange(updated);
        setNewMember(null);
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 3000);
      }
    } catch (e) {
      setAddError(String(e));
    }
    setAdding(false);
  }

  async function prepareCsvImport(zgId: string, file: File) {
    setCsvResult(null);
    // Strip a UTF-8 BOM (common in Excel exports) — otherwise it sticks to the
    // first header cell (e.g. "Anrede") and silently fails to match.
    const text = (await file.text()).replace(/^﻿/, "");
    const lines = text.trim().split(/\r?\n/);
    const delim = lines[0].includes(";") ? ";" : ",";
    const splitLine = (l: string) => l.split(delim).map(c => c.trim().replace(/^"|"$/g, ""));
    // Fuzzy header matching: normalize (lowercase, strip spaces/underscores/diacritics)
    // and match against a synonym list, so "Last Name", "last_name", "Nachname" and
    // "salutation"/"Anrede" are all recognized regardless of exact spelling.
    const headers = splitLine(lines[0]).map(norm);
    const iFirst = headers.findIndex(h => HEADER_ALIASES.first_name.includes(h));
    const iLast = headers.findIndex(h => HEADER_ALIASES.last_name.includes(h));
    let iEmail = headers.findIndex(h => HEADER_ALIASES.email.includes(h));
    let iAnrede = headers.findIndex(h => HEADER_ALIASES.anrede.includes(h));
    let iSprache = headers.findIndex(h => HEADER_ALIASES.sprache.includes(h));

    // Fallback: for columns whose header didn't match anything, sniff the actual
    // values (does it look like an email? a salutation? a language?) — catches
    // headers we never listed without needing a code change for every new wording.
    const claimed = new Set([iFirst, iLast, iEmail, iAnrede, iSprache].filter(i => i >= 0));
    if (iEmail < 0 || iAnrede < 0 || iSprache < 0) {
      const sampleRows = lines.slice(1, 21).filter(l => l.trim()).map(splitLine);
      const byContent = detectColumnsByContent(sampleRows, headers.length, claimed);
      if (iEmail < 0) iEmail = byContent.email;
      if (iAnrede < 0) iAnrede = byContent.anrede;
      if (iSprache < 0) iSprache = byContent.sprache;
    }

    const missingColumns = [
      iFirst < 0 ? "Vorname" : null,
      iLast < 0 ? "Name" : null,
      iEmail < 0 ? "E-Mail" : null,
    ].filter((x): x is string => x !== null);

    const rows = missingColumns.length > 0 ? [] : lines.slice(1).filter(l => l.trim()).map(l => {
      const cols = splitLine(l);
      const spracheRaw = iSprache >= 0 ? (cols[iSprache] ?? "") : "";
      return {
        first_name: cols[iFirst] ?? "",
        last_name: cols[iLast] ?? "",
        email: cols[iEmail] ?? "",
        anrede: iAnrede >= 0 ? (cols[iAnrede] ?? "") : "",
        sprache: normalizeSprache(spracheRaw),
      };
    }).filter(r => r.email);

    const detectedColumns = [
      iAnrede >= 0 && "Anrede",
      iLast >= 0 && "Name",
      iFirst >= 0 && "Vorname",
      iEmail >= 0 && "E-Mail",
      iSprache >= 0 && "Sprache",
    ].filter((x): x is string => Boolean(x));

    setCsvPreview({ zgId, file, rows, detectedColumns, missingColumns });
  }

  async function confirmCsvImport() {
    if (!csvPreview) return;
    const { zgId, rows } = csvPreview;
    setCsvImporting(true);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: rows, zielgruppe_id: zgId, event_id: eventId, adminPassword }),
    });
    const d = await res.json();
    setCsvResult({ zgId, inserted: d.inserted ?? 0 });
    const updated = await fetch(`/api/members?eventId=${eventId}`, { headers: { "Authorization": `Bearer ${adminPassword}` } }).then(r => r.json());
    if (Array.isArray(updated)) onMembersChange(updated);
    setCsvImporting(false);
    setCsvZgId(null);
    setCsvPreview(null);
    if (csvRef.current) csvRef.current.value = "";
  }

  function cancelCsvImport() {
    setCsvPreview(null);
    setCsvZgId(null);
    if (csvRef.current) csvRef.current.value = "";
  }

  function exportZielgruppeCsv(zg: Zielgruppe) {
    const list = groupMembers(zg.id);
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Anrede", "Vorname", "Name", "E-Mail", "Sprache", "Code"].map(esc).join(",");
    const lines = list.map(m => {
      const ic = Array.isArray(m.invite_codes) ? m.invite_codes[0] : m.invite_codes;
      return [m.anrede ?? "", m.first_name, m.last_name, m.email, m.sprache ? m.sprache.toUpperCase() : "", ic?.code ?? ""]
        .map(esc).join(",");
    });
    // Leading BOM so Excel recognizes UTF-8 and renders umlauts correctly on open.
    const blob = new Blob(["﻿" + [header, ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `zielgruppe_${zg.name.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function openHubSpot(zgId: string) {
    setHsZgId(zgId); setHsSelectedList(""); setHsResult(null);
    if (hsLists.length > 0) return;
    setHsLoading(true);
    const res = await fetch("/api/admin/hubspot?action=lists", { headers: { "Authorization": `Bearer ${adminPassword}` } });
    const d = await res.json();
    setHsLists(d.lists ?? []);
    setHsLoading(false);
  }

  async function importFromHubSpot(zgId: string) {
    if (!hsSelectedList) return;
    setHsImporting(true);
    const res = await fetch("/api/admin/hubspot", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword, listId: hsSelectedList, zielgruppe_id: zgId }),
    });
    const d = await res.json();
    setHsImporting(false);
    if (res.ok) {
      setHsResult({ zgId, imported: d.imported, duplicates: d.duplicates });
      // Reload members
      const mr = await fetch("/api/members", { headers: { "Authorization": `Bearer ${adminPassword}` } });
      const md = await mr.json();
      if (Array.isArray(md)) onMembersChange(md);
      setHsZgId(null);
    }
  }

  async function createZG() {
    if (!newZGName.trim()) return;
    setCreatingZG(true);
    const res = await fetch("/api/zielgruppen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newZGName.trim(), event_id: eventId, adminPassword }) });
    const d = await res.json();
    if (res.ok) { onZielgruppeChange([...zielgruppen, d].sort((a, b) => a.name.localeCompare(b.name))); setNewZGName(""); }
    setCreatingZG(false);
  }

  async function renameZG(id: string) {
    if (!renamingName.trim()) return;
    const res = await fetch(`/api/zielgruppen/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renamingName.trim(), adminPassword }) });
    const d = await res.json();
    if (res.ok) { onZielgruppeChange(zielgruppen.map(z => z.id === id ? d : z).sort((a, b) => a.name.localeCompare(b.name))); }
    setRenamingId(null);
  }

  async function deleteZG(id: string) {
    await fetch(`/api/zielgruppen/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword }) });
    onZielgruppeChange(zielgruppen.filter(z => z.id !== id));
    onMembersChange(members.map(m => m.zielgruppe_id === id ? { ...m, zielgruppe_id: null } : m));
    if (expanded === id) setExpanded(null);
  }

  return (
    <div className="space-y-3">
      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(30,50,99,0.35)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl" style={{ background: "white" }}>
            <div className="h-0.5" style={{ background: "#dc2626" }} />
            <div className="px-6 pt-6 pb-4">
              <p className="font-bold text-sm mb-1" style={{ color: "var(--ig-navy)" }}>Mitglied löschen</p>
              <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>{deleteConfirm.name} wirklich entfernen?</p>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className={`${btnSecondary} flex-1 py-2`}
                style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)" }}>Abbrechen</button>
              <button onClick={() => { deleteMember(deleteConfirm.id); setDeleteConfirm(null); }}
                className={`${btnPrimary} flex-1 py-2`}
                style={{ background: "#dc2626", color: "white" }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk member delete confirm dialog */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(30,50,99,0.35)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl" style={{ background: "white" }}>
            <div className="h-0.5" style={{ background: "#dc2626" }} />
            <div className="px-6 pt-6 pb-4">
              <p className="font-bold text-sm mb-1" style={{ color: "var(--ig-navy)" }}>Mitglieder löschen</p>
              <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>{bulkDeleteConfirm.label} Mitglieder ({bulkDeleteConfirm.ids.length}) wirklich entfernen?</p>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(null)}
                className={`${btnSecondary} flex-1 py-2`}
                style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)" }}>Abbrechen</button>
              <button disabled={bulkDeleting} onClick={runBulkDelete}
                className={`${btnPrimary} flex-1 py-2 disabled:opacity-50`}
                style={{ background: "#dc2626", color: "white" }}>{bulkDeleting ? "Löscht…" : "Löschen"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Zielgruppe delete confirm dialog */}
      {zgDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(30,50,99,0.35)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl" style={{ background: "white" }}>
            <div className="h-0.5" style={{ background: "#dc2626" }} />
            <div className="px-6 pt-6 pb-4">
              <p className="font-bold text-sm mb-1" style={{ color: "var(--ig-navy)" }}>Zielgruppe löschen</p>
              <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>{`„${zgDeleteConfirm.name}“ wirklich löschen? Mitglieder werden nicht gelöscht, aber aus dieser Zielgruppe entfernt.`}</p>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setZgDeleteConfirm(null)}
                className={`${btnSecondary} flex-1 py-2`}
                style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)" }}>Abbrechen</button>
              <button onClick={() => { deleteZG(zgDeleteConfirm.id); setZgDeleteConfirm(null); }}
                className={`${btnPrimary} flex-1 py-2`}
                style={{ background: "#dc2626", color: "white" }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
      {/* CSV import preview dialog */}
      {csvPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(30,50,99,0.35)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl" style={{ background: "white" }}>
            <div className="h-0.5" style={{ background: csvPreview.missingColumns.length > 0 ? "#dc2626" : "var(--ig-gold)" }} />
            <div className="px-6 pt-6 pb-4">
              <p className="font-bold text-sm mb-1" style={{ color: "var(--ig-navy)" }}>CSV-Import prüfen</p>
              <p className="text-xs mb-3" style={{ color: "var(--ig-gray3)" }}>{csvPreview.file.name}</p>

              {csvPreview.missingColumns.length > 0 ? (
                <p className="text-xs" style={{ color: "#dc2626" }}>
                  {`Pflichtspalten fehlen: ${csvPreview.missingColumns.join(", ")}. Erwartete Spalten (Schreibweise flexibel): Anrede, Name, Vorname, E-Mail, Sprache — z.B. auch „Last Name", „Salutation" oder „Language" werden erkannt. Anrede und Sprache sind optional.`}
                </p>
              ) : (
                <>
                  <p className="text-xs mb-3" style={{ color: "var(--ig-navy)" }}>
                    <span className="font-semibold">{csvPreview.rows.length}</span> Zeilen erkannt · Spalten: {csvPreview.detectedColumns.join(", ")}
                  </p>
                  {csvPreview.rows.length > 0 && (
                    <div className="rounded-lg border overflow-hidden mb-1" style={{ borderColor: "var(--ig-gray2)" }}>
                      <table className="w-full text-xs">
                        <tbody>
                          {csvPreview.rows.slice(0, 5).map((r, i) => (
                            <tr key={i} className="border-t first:border-t-0" style={{ borderColor: "var(--ig-gray2)" }}>
                              <td className="px-2.5 py-1.5" style={{ color: "var(--ig-navy)" }}>{r.first_name} {r.last_name}</td>
                              <td className="px-2.5 py-1.5" style={{ color: "var(--ig-gray3)" }}>{r.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvPreview.rows.length > 5 && (
                        <p className="text-xs px-2.5 py-1.5 border-t" style={{ color: "var(--ig-gray3)", borderColor: "var(--ig-gray2)" }}>
                          … und {csvPreview.rows.length - 5} weitere
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={cancelCsvImport}
                className={`${btnSecondary} flex-1 py-2`}
                style={{ border: "1.5px solid var(--ig-gray2)", color: "var(--ig-black)" }}>Abbrechen</button>
              <button onClick={confirmCsvImport}
                disabled={csvPreview.missingColumns.length > 0 || csvPreview.rows.length === 0 || csvImporting}
                className={`${btnPrimary} flex-1 py-2`}
                style={{ background: "var(--ig-navy)", color: "white" }}>
                {csvImporting ? "Importiert…" : `Import starten (${csvPreview.rows.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
      <input ref={csvRef} type="file" accept=".csv" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && csvZgId) prepareCsvImport(csvZgId, file);
        }} />

      {/* Create new Zielgruppe — top */}
      <div className="flex gap-2">
        <input className={inputCls} style={{ ...inputStyle, flex: 1 }} placeholder="Neue Zielgruppe…"
          value={newZGName} onChange={e => setNewZGName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") createZG(); }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--ig-navy)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--ig-gray2)")} />
        <button disabled={creatingZG || !newZGName.trim()} onClick={createZG}
          className={`${btnPrimary} px-4`}
          style={{ background: "var(--ig-navy)", color: "white" }}>
          {creatingZG ? "…" : "Erstellen"}
        </button>
      </div>

      {zielgruppen.map(zg => {
        const list = groupMembers(zg.id);
        const isOpen = expanded === zg.id;
        return (
          <div key={zg.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--ig-gray2)", background: "white" }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: isOpen ? "var(--ig-navy)" : "white" }}>
              {renamingId === zg.id ? (
                <>
                  <input autoFocus className={inputCls} style={{ ...inputStyle, flex: 1 }}
                    value={renamingName}
                    onChange={e => setRenamingName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") renameZG(zg.id); if (e.key === "Escape") setRenamingId(null); }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--ig-gold)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--ig-gray2)")} />
                  <button onClick={() => renameZG(zg.id)} className={btnPrimary} style={{ background: "var(--ig-gold)", color: "white" }}>Speichern</button>
                  <button onClick={() => setRenamingId(null)} className={btnSecondary} style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>Abbrechen</button>
                </>
              ) : (
                <>
                  <button className="flex-1 flex items-center gap-3 text-left transition active:scale-[0.99]"
                    onClick={() => {
                    if (isOpen) {
                      setExpanded(null);
                      setSearchQuery(q => { const n = { ...q }; delete n[zg.id]; return n; });
                    } else {
                      setExpanded(zg.id);
                    }
                    setEditing(null); setNewMember(null); setCsvResult(null);
                  }}>
                    <span className="font-semibold text-sm" style={{ color: isOpen ? "white" : "var(--ig-navy)" }}>{zg.name}</span>
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: isOpen ? "rgba(255,255,255,0.15)" : "var(--ig-light)", color: isOpen ? "white" : "var(--ig-gray3)" }}>
                      {list.length}
                    </span>
                    <svg className="ml-auto w-4 h-4 transition-transform" style={{ color: isOpen ? "white" : "var(--ig-gray3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button title="Umbenennen" aria-label="Zielgruppe umbenennen" onClick={() => { setRenamingId(zg.id); setRenamingName(zg.name); }}
                    className={`${btnIcon} opacity-60 hover:opacity-100`}
                    style={{ color: isOpen ? "white" : "var(--ig-gray3)" }}><IconPencilSmall /></button>
                  <button title="Löschen" aria-label="Zielgruppe löschen" onClick={() => setZgDeleteConfirm({ id: zg.id, name: zg.name })}
                    className={`${btnIcon} opacity-60 hover:opacity-100`}
                    style={{ color: isOpen ? "white" : "var(--ig-gray3)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Member table */}
            {isOpen && (
              <div
                className="relative"
                onDragOver={e => { e.preventDefault(); setDragOverZg(zg.id); }}
                onDragLeave={e => { e.preventDefault(); setDragOverZg(prev => prev === zg.id ? null : prev); }}
                onDrop={e => {
                  e.preventDefault();
                  setDragOverZg(prev => prev === zg.id ? null : prev);
                  const file = e.dataTransfer.files?.[0];
                  if (file) prepareCsvImport(zg.id, file);
                }}
              >
                {dragOverZg === zg.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none rounded-b-2xl"
                    style={{ background: "rgba(30,50,99,0.06)", border: "2px dashed var(--ig-gold)" }}>
                    <p className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: "white", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gold)" }}>
                      CSV hier ablegen zum Importieren
                    </p>
                  </div>
                )}
                {/* Search bar */}
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--ig-gray2)", background: "var(--ig-light)" }}>
                  <div className="relative flex-1">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--ig-gray3)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
                    <input
                      className={inputCls}
                      style={{ ...inputStyle, paddingLeft: "2rem" }}
                      placeholder="Suchen…"
                      value={searchQuery[zg.id] ?? ""}
                      onChange={e => setSearchQuery(q => ({ ...q, [zg.id]: e.target.value }))}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--ig-navy)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--ig-gray2)")}
                    />
                    {searchQuery[zg.id] && (
                      <button onClick={() => setSearchQuery(q => ({ ...q, [zg.id]: "" }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100 transition"
                        style={{ color: "var(--ig-gray3)" }}>✕</button>
                    )}
                  </div>
                  {unsubCount(zg.id) > 0 && (
                    <button
                      onClick={() => setShowUnsub(s => ({ ...s, [zg.id]: !s[zg.id] }))}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition flex-shrink-0"
                      style={{
                        border: "1px solid",
                        borderColor: showUnsub[zg.id] ? "#dc2626" : "var(--ig-gray2)",
                        color: showUnsub[zg.id] ? "#dc2626" : "var(--ig-gray3)",
                        background: showUnsub[zg.id] ? "#fff5f5" : "white",
                      }}
                    >
                      {unsubCount(zg.id)} abgemeldet {showUnsub[zg.id] ? "ausblenden" : "anzeigen"}
                    </button>
                  )}
                </div>

                {/* Selection toolbar */}
                {(selected[zg.id]?.size ?? 0) > 0 && (
                  <div className="px-4 py-2 flex items-center gap-3" style={{ borderBottom: "1px solid var(--ig-gray2)", background: "#fff8ec" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--ig-navy)" }}>{selected[zg.id]!.size} ausgewählt</span>
                    <button
                      onClick={() => {
                        const ids = Array.from(selected[zg.id] ?? []);
                        const allInList = list.length > 0 && ids.length === list.length;
                        setBulkDeleteConfirm({ zgId: zg.id, ids, label: allInList ? "Alle ausgewählten" : `${ids.length}` });
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80"
                      style={{ background: "#dc2626", color: "white" }}
                    >
                      Löschen
                    </button>
                    <button
                      onClick={() => setSelected(prev => ({ ...prev, [zg.id]: new Set() }))}
                      className="text-xs transition hover:opacity-70"
                      style={{ color: "var(--ig-gray3)" }}
                    >
                      Auswahl aufheben
                    </button>
                  </div>
                )}

                {list.length > 0 ? (
                  <>
                  <p className="sm:hidden text-xs px-4 pt-2" style={{ color: "var(--ig-gray3)" }}>→ Nach rechts wischen für weitere Spalten</p>
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ borderCollapse: "collapse", minWidth: 560 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ig-gray2)", background: "var(--ig-light)" }}>
                        <th className="px-4 py-2 w-8">
                          <input type="checkbox" aria-label="Alle auswählen"
                            checked={list.length > 0 && list.every(m => selected[zg.id]?.has(m.id))}
                            onChange={() => toggleSelectAll(zg.id, list.map(m => m.id))}
                            style={{ accentColor: "var(--ig-navy)" }} />
                        </th>
                        {([
                          { key: "anrede" as SortKey, label: "Anrede" },
                          { key: "first_name" as SortKey, label: "Vorname" },
                          { key: "last_name" as SortKey, label: "Nachname" },
                          { key: "email" as SortKey, label: "E-Mail" },
                          { key: "sprache" as SortKey, label: "Sprache" },
                        ]).map(col => (
                          <th key={col.key} className="text-left px-4 py-2 font-semibold cursor-pointer select-none" style={{ color: "var(--ig-gray3)" }}
                            onClick={() => toggleSort(zg.id, col.key)}>
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              {sortConfig[zg.id]?.key === col.key && (sortConfig[zg.id]?.dir === "asc" ? <IconSortUp /> : <IconSortDown />)}
                            </span>
                          </th>
                        ))}
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Code</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(m => (
                        <tr key={m.id} style={{ borderBottom: "1px solid var(--ig-gray2)" }}>
                          <td className="px-4 py-2.5">
                            <input type="checkbox" aria-label={`${m.first_name} ${m.last_name} auswählen`}
                              checked={selected[zg.id]?.has(m.id) ?? false}
                              onChange={() => toggleSelectOne(zg.id, m.id)}
                              style={{ accentColor: "var(--ig-navy)" }} />
                          </td>
                          {editing?.id === m.id ? (
                            <>
                              <td className="px-3 py-2">
                                <select className={inputCls} style={inputStyle} value={editing.anrede} onChange={e => setEditing({ ...editing, anrede: e.target.value })}>
                                  {ANREDE_OPTIONS.map(o => <option key={o} value={o}>{o || "—"}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2"><input className={inputCls} style={inputStyle} value={editing.first_name} onChange={e => setEditing({ ...editing, first_name: e.target.value })} /></td>
                              <td className="px-3 py-2"><input className={inputCls} style={inputStyle} value={editing.last_name} onChange={e => setEditing({ ...editing, last_name: e.target.value })} /></td>
                              <td className="px-3 py-2"><input className={inputCls} style={inputStyle} value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></td>
                              <td className="px-3 py-2">
                                <select className={inputCls} style={inputStyle} value={editing.sprache} onChange={e => setEditing({ ...editing, sprache: e.target.value })}>
                                  {SPRACHE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2" />
                              <td className="px-3 py-2">
                                <div className="flex gap-1.5">
                                  <button disabled={saving} onClick={saveEdit} aria-label="Änderungen speichern" className={`${btnPrimary} disabled:opacity-50`} style={{ background: "var(--ig-navy)", color: "white" }}>{saving ? "…" : "✓"}</button>
                                  <button onClick={() => setEditing(null)} aria-label="Bearbeiten abbrechen" className={btnSecondary} style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}><IconXSmall className="w-3 h-3" /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2.5" style={{ color: "var(--ig-gray3)" }}>{m.anrede || "—"}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: m.unsubscribed ? "var(--ig-gray3)" : "var(--ig-navy)" }}>
                                {m.first_name}
                                {m.unsubscribed && <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: "#fff5f5", color: "#dc2626", border: "1px solid #fecaca" }}>abgemeldet</span>}
                              </td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: m.unsubscribed ? "var(--ig-gray3)" : "var(--ig-navy)" }}>{m.last_name}</td>
                              <td className="px-4 py-2.5 max-w-[160px]" style={{ color: "var(--ig-gray3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</td>
                              <td className="px-4 py-2.5">
                                {m.sprache
                                  ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--ig-light)", color: "var(--ig-navy)" }}>{m.sprache.toUpperCase()}</span>
                                  : <span style={{ color: "var(--ig-gray2)" }}>—</span>
                                }
                              </td>
                              <td className="px-4 py-2.5">
                                {(() => {
                                  const ic = Array.isArray(m.invite_codes) ? m.invite_codes[0] : m.invite_codes;
                                  return ic?.code ? (
                                    <span className="font-mono text-xs font-bold" style={{ color: ic.used ? "var(--ig-gray3)" : "var(--ig-gold)", textDecoration: ic.used ? "line-through" : "none", letterSpacing: "0.08em" }}>{ic.code}</span>
                                  ) : <span className="text-xs" style={{ color: "var(--ig-gray2)" }}>—</span>;
                                })()}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1.5 justify-end">
                                  <button onClick={() => setEditing({ id: m.id, first_name: m.first_name, last_name: m.last_name, email: m.email, anrede: m.anrede || "", sprache: m.sprache || "de" })}
                                    aria-label="Mitglied bearbeiten"
                                    className={`${btnSecondary} hover:border-[var(--ig-navy)] hover:text-[var(--ig-navy)]`} style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}><IconPencilSmall className="w-3 h-3" /></button>
                                  <button onClick={() => setDeleteConfirm({ id: m.id, name: `${m.first_name} ${m.last_name}` })}
                                    aria-label="Mitglied löschen"
                                    className={`${btnSecondary} hover:bg-red-50`} style={{ background: "var(--ig-light)", color: "#dc2626", border: "1.5px solid var(--ig-gray2)" }}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: "var(--ig-navy)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                    <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>
                      {searchQuery[zg.id] ? `Keine Treffer für „${searchQuery[zg.id]}".` : "Noch keine Mitglieder — CSV importieren oder manuell hinzufügen."}
                    </p>
                  </div>
                )}

                {/* Footer: add member + CSV import */}
                <div className="px-4 py-3 space-y-3" style={{ borderTop: "1px solid var(--ig-gray2)" }}>
                  {newMember ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <select className={inputCls} style={inputStyle} value={newMember.anrede} onChange={e => setNewMember({ ...newMember, anrede: e.target.value })}>
                          {ANREDE_OPTIONS.map(o => <option key={o} value={o}>{o || "Anrede"}</option>)}
                        </select>
                        <input className={inputCls} style={inputStyle} placeholder="Vorname *" value={newMember.first_name} onChange={e => setNewMember({ ...newMember, first_name: e.target.value })} />
                        <input className={inputCls} style={inputStyle} placeholder="Nachname *" value={newMember.last_name} onChange={e => setNewMember({ ...newMember, last_name: e.target.value })} />
                        <input className={inputCls + " col-span-2"} style={inputStyle} placeholder="E-Mail *" type="email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
                        <select className={inputCls} style={inputStyle} value={newMember.sprache} onChange={e => setNewMember({ ...newMember, sprache: e.target.value })}>
                          {SPRACHE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <button disabled={adding || !newMember.first_name || !newMember.last_name || !newMember.email}
                            onClick={() => addMember(zg.id)}
                            className={btnPrimary}
                            style={{ background: "var(--ig-navy)", color: "white" }}>
                            {adding ? "Wird hinzugefügt…" : "Hinzufügen"}
                          </button>
                          <button onClick={() => { setNewMember(null); setAddError(null); }} className={btnSecondary} style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>Abbrechen</button>
                        </div>
                        {addError && <p className="text-xs" style={{ color: "#dc2626" }}>Fehler: {addError}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                    {addSuccess && (
                      <p className="text-xs font-medium" style={{ color: "#16a34a" }}>✓ Mitglied hinzugefügt</p>
                    )}
                    <div className="flex items-center gap-4">
                      <button onClick={() => { setNewMember(emptyNew()); setAddSuccess(false); }}
                        className="text-xs font-medium flex items-center gap-1.5 transition active:scale-95 opacity-90 hover:opacity-100"
                        style={{ color: "var(--ig-gold)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Mitglied hinzufügen
                      </button>
                      <span style={{ color: "var(--ig-gray2)" }}>|</span>
                      <button
                        disabled={csvImporting}
                        onClick={() => { setCsvZgId(zg.id); setCsvResult(null); csvRef.current?.click(); }}
                        className="text-xs font-medium flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 opacity-90 hover:opacity-100"
                        style={{ color: "var(--ig-gold)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {csvImporting && csvZgId === zg.id ? "Importiert…" : "CSV importieren"}
                      </button>
                      {csvResult?.zgId === zg.id && (
                        <span className="text-xs" style={{ color: csvResult.inserted < 0 ? "#dc2626" : "#16a34a" }}>
                          {csvResult.inserted < 0 ? "Spalten fehlen (Name, Vorname, E-Mail)" : `✓ ${csvResult.inserted} importiert`}
                        </span>
                      )}
                      <span style={{ color: "var(--ig-gray2)" }}>|</span>
                      <button
                        onClick={() => hsZgId === zg.id ? setHsZgId(null) : openHubSpot(zg.id)}
                        className="text-xs font-medium flex items-center gap-1.5 transition active:scale-95 opacity-90 hover:opacity-100"
                        style={{ color: "var(--ig-gold)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" /></svg>
                        HubSpot importieren
                      </button>
                      {list.length > 0 && (
                        <>
                          <span style={{ color: "var(--ig-gray2)" }}>|</span>
                          <button
                            onClick={() => exportZielgruppeCsv(zg)}
                            className="text-xs font-medium flex items-center gap-1.5 transition active:scale-95 opacity-90 hover:opacity-100"
                            style={{ color: "var(--ig-gold)" }}>
                            <IconDownloadSmall />
                            CSV exportieren
                          </button>
                        </>
                      )}
                      {hsResult?.zgId === zg.id && (
                        <span className="text-xs" style={{ color: "#16a34a" }}>✓ {hsResult.imported} importiert, {hsResult.duplicates} Duplikate</span>
                      )}
                    </div>
                    {hsZgId === zg.id && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {hsLoading ? (
                          <span className="text-xs" style={{ color: "var(--ig-gray3)" }}>Lädt Listen…</span>
                        ) : (
                          <>
                            <select value={hsSelectedList} onChange={e => setHsSelectedList(e.target.value)}
                              className={inputCls} style={{ ...inputStyle, maxWidth: 260 }}>
                              <option value="">Liste auswählen…</option>
                              {hsLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                            <button disabled={!hsSelectedList || hsImporting} onClick={() => importFromHubSpot(zg.id)}
                              className={btnPrimary} style={{ background: "var(--ig-navy)", color: "white" }}>
                              {hsImporting ? "Importiert…" : "Importieren"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
