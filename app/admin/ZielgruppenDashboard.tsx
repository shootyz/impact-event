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
const btnIcon = "transition hover:opacity-100 active:scale-95 p-2 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center";

type EditingMember = {
  id: string; first_name: string; last_name: string;
  email: string; anrede: string; sprache: string;
};

type NewMember = { first_name: string; last_name: string; email: string; anrede: string; sprache: string };
const emptyNew = (): NewMember => ({ first_name: "", last_name: "", email: "", anrede: "", sprache: "de" });

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
  const [csvZgId, setCsvZgId] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ zgId: string; inserted: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const csvRef = useRef<HTMLInputElement>(null);

  const groupMembers = (zgId: string) => {
    const q = (searchQuery[zgId] ?? "").toLowerCase().trim();
    return members
      .filter(m => m.zielgruppe_id === zgId && !m.unsubscribed)
      .filter(m => !q || [m.first_name, m.last_name, m.email, m.anrede ?? ""].join(" ").toLowerCase().includes(q));
  };

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

  async function importCsv(zgId: string, file: File) {
    setCsvImporting(true);
    setCsvResult(null);
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const delim = lines[0].includes(";") ? ";" : ",";
    const splitLine = (l: string) => l.split(delim).map(c => c.trim().replace(/^"|"$/g, ""));
    const headers = splitLine(lines[0]).map(h => h.toLowerCase());
    const iFirst = headers.findIndex(h => h === "first_name" || h === "vorname");
    const iLast = headers.findIndex(h => h === "last_name" || h === "name");
    const iEmail = headers.findIndex(h => h === "email" || h === "e-mail");
    const iAnrede = headers.findIndex(h => h === "anrede");
    const iSprache = headers.findIndex(h => h === "sprache");
    if (iFirst < 0 || iLast < 0 || iEmail < 0) {
      setCsvResult({ zgId, inserted: -1 });
      setCsvImporting(false);
      return;
    }
    const rows = lines.slice(1).filter(l => l.trim()).map(l => {
      const cols = splitLine(l);
      const spracheRaw = iSprache >= 0 ? (cols[iSprache] ?? "").toLowerCase() : "";
      return {
        first_name: cols[iFirst] ?? "",
        last_name: cols[iLast] ?? "",
        email: cols[iEmail] ?? "",
        anrede: iAnrede >= 0 ? (cols[iAnrede] ?? "") : "",
        sprache: spracheRaw || null,
      };
    }).filter(r => r.email);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: rows, zielgruppe_id: zgId, event_id: eventId, adminPassword }),
    });
    const d = await res.json();
    setCsvResult({ zgId, inserted: d.inserted ?? 0 });
    const updated = await fetch(`/api/members?eventId=${eventId}&adminPassword=${encodeURIComponent(adminPassword)}`).then(r => r.json());
    if (Array.isArray(updated)) onMembersChange(updated);
    setCsvImporting(false);
    setCsvZgId(null);
    if (csvRef.current) csvRef.current.value = "";
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
      <input ref={csvRef} type="file" accept=".csv" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && csvZgId) importCsv(csvZgId, file);
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
                  <button title="Umbenennen" onClick={() => { setRenamingId(zg.id); setRenamingName(zg.name); }}
                    className={`${btnIcon} opacity-60 hover:opacity-100`}
                    style={{ color: isOpen ? "white" : "var(--ig-gray3)" }}>✎</button>
                  <button title="Löschen" onClick={() => deleteZG(zg.id)}
                    className={`${btnIcon} opacity-60 hover:opacity-100`}
                    style={{ color: isOpen ? "white" : "var(--ig-gray3)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Member table */}
            {isOpen && (
              <div>
                {/* Search bar */}
                <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--ig-gray2)", background: "var(--ig-light)" }}>
                  <div className="relative">
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
                </div>
                {list.length > 0 ? (
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ borderCollapse: "collapse", minWidth: 560 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ig-gray2)", background: "var(--ig-light)" }}>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Anrede</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Vorname</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Nachname</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>E-Mail</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Sprache</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Code</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(m => (
                        <tr key={m.id} style={{ borderBottom: "1px solid var(--ig-gray2)" }}>
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
                                  <button disabled={saving} onClick={saveEdit} className={`${btnPrimary} disabled:opacity-50`} style={{ background: "var(--ig-navy)", color: "white" }}>{saving ? "…" : "✓"}</button>
                                  <button onClick={() => setEditing(null)} className={btnSecondary} style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>✕</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2.5" style={{ color: "var(--ig-gray3)" }}>{m.anrede || "—"}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "var(--ig-navy)" }}>{m.first_name}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "var(--ig-navy)" }}>{m.last_name}</td>
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
                                    className={`${btnSecondary} hover:border-[var(--ig-navy)] hover:text-[var(--ig-navy)]`} style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>✎</button>
                                  <button onClick={() => setDeleteConfirm({ id: m.id, name: `${m.first_name} ${m.last_name}` })}
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
                          {csvResult.inserted < 0 ? "Spalten fehlen (first_name, last_name, email)" : `✓ ${csvResult.inserted} importiert`}
                        </span>
                      )}
                    </div>
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
