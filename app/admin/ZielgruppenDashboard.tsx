"use client";
import { useState } from "react";
import type { Zielgruppe, Member } from "@/lib/supabase";

const ANREDE_OPTIONS = ["", "Herr", "Frau", "Divers"];
const SPRACHE_OPTIONS = [
  { value: "de", label: "DE" },
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

const inputCls = "w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition";
const inputStyle = { borderColor: "var(--ig-gray2)", color: "var(--ig-navy)", background: "white" };

type EditingMember = {
  id: string; first_name: string; last_name: string;
  email: string; anrede: string; sprache: string;
};

type NewMember = { first_name: string; last_name: string; email: string; anrede: string; sprache: string };
const emptyNew = (): NewMember => ({ first_name: "", last_name: "", email: "", anrede: "", sprache: "de" });

export default function ZielgruppenDashboard({
  zielgruppen, members, eventId,
  onMembersChange, onZielgruppeChange,
}: {
  zielgruppen: Zielgruppe[];
  members: Member[];
  eventId: string;
  onMembersChange: (members: Member[]) => void;
  onZielgruppeChange: (zielgruppen: Zielgruppe[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingMember | null>(null);
  const [newMember, setNewMember] = useState<NewMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newZGName, setNewZGName] = useState("");
  const [creatingZG, setCreatingZG] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");

  const groupMembers = (zgId: string) =>
    members.filter(m => m.zielgruppe_id === zgId && !m.unsubscribed);

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch(`/api/members/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      const d = await res.json();
      onMembersChange(members.map(m => m.id === d.id ? { ...m, ...d } : m));
      setEditing(null);
    }
    setSaving(false);
  }

  async function deleteMember(id: string) {
    await fetch("/api/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    onMembersChange(members.filter(m => m.id !== id));
  }

  async function addMember(zgId: string) {
    if (!newMember) return;
    setAdding(true);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: [newMember], zielgruppe_id: zgId, event_id: eventId }),
    });
    const d = await res.json();
    if (res.ok) {
      const updated = await fetch(`/api/members?eventId=${eventId}`).then(r => r.json());
      if (Array.isArray(updated)) onMembersChange(updated);
      setNewMember(null);
    }
    setAdding(false);
  }

  async function createZG() {
    if (!newZGName.trim()) return;
    setCreatingZG(true);
    const res = await fetch("/api/zielgruppen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newZGName.trim(), event_id: eventId }) });
    const d = await res.json();
    if (res.ok) { onZielgruppeChange([...zielgruppen, d].sort((a, b) => a.name.localeCompare(b.name))); setNewZGName(""); }
    setCreatingZG(false);
  }

  async function renameZG(id: string) {
    if (!renamingName.trim()) return;
    const res = await fetch(`/api/zielgruppen/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renamingName.trim() }) });
    const d = await res.json();
    if (res.ok) { onZielgruppeChange(zielgruppen.map(z => z.id === id ? d : z).sort((a, b) => a.name.localeCompare(b.name))); }
    setRenamingId(null);
  }

  async function deleteZG(id: string) {
    await fetch(`/api/zielgruppen/${id}`, { method: "DELETE" });
    onZielgruppeChange(zielgruppen.filter(z => z.id !== id));
    onMembersChange(members.map(m => m.zielgruppe_id === id ? { ...m, zielgruppe_id: null } : m));
    if (expanded === id) setExpanded(null);
  }

  return (
    <div className="space-y-3">
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
                  <button onClick={() => renameZG(zg.id)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "var(--ig-gold)", color: "white" }}>Speichern</button>
                  <button onClick={() => setRenamingId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>Abbrechen</button>
                </>
              ) : (
                <>
                  <button className="flex-1 flex items-center gap-3 text-left"
                    onClick={() => { setExpanded(isOpen ? null : zg.id); setEditing(null); setNewMember(null); }}>
                    <span className="font-semibold text-sm" style={{ color: isOpen ? "white" : "var(--ig-navy)" }}>{zg.name}</span>
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: isOpen ? "rgba(255,255,255,0.15)" : "var(--ig-light)", color: isOpen ? "white" : "var(--ig-gray3)" }}>
                      {list.length}
                    </span>
                    <svg className="ml-auto w-4 h-4 transition-transform" style={{ color: isOpen ? "white" : "var(--ig-gray3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button title="Umbenennen" onClick={() => { setRenamingId(zg.id); setRenamingName(zg.name); }}
                    className="p-1.5 rounded-lg text-xs" style={{ color: isOpen ? "rgba(255,255,255,0.6)" : "var(--ig-gray3)" }}>✎</button>
                  <button title="Löschen" onClick={() => deleteZG(zg.id)}
                    className="p-1.5 rounded-lg text-xs" style={{ color: isOpen ? "rgba(255,255,255,0.6)" : "var(--ig-gray3)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Member table */}
            {isOpen && (
              <div>
                {list.length > 0 ? (
                  <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ig-gray2)", background: "var(--ig-light)" }}>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Anrede</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Vorname</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Nachname</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>E-Mail</th>
                        <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--ig-gray3)" }}>Sprache</th>
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
                              <td className="px-3 py-2">
                                <div className="flex gap-1.5">
                                  <button disabled={saving} onClick={saveEdit} className="px-2.5 py-1 rounded-lg font-semibold text-xs disabled:opacity-50" style={{ background: "var(--ig-navy)", color: "white" }}>{saving ? "…" : "✓"}</button>
                                  <button onClick={() => setEditing(null)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>✕</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2.5" style={{ color: "var(--ig-gray3)" }}>{m.anrede || "—"}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "var(--ig-navy)" }}>{m.first_name}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "var(--ig-navy)" }}>{m.last_name}</td>
                              <td className="px-4 py-2.5" style={{ color: "var(--ig-gray3)" }}>{m.email}</td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--ig-light)", color: "var(--ig-navy)" }}>{(m.sprache || "de").toUpperCase()}</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1.5 justify-end">
                                  <button onClick={() => setEditing({ id: m.id, first_name: m.first_name, last_name: m.last_name, email: m.email, anrede: m.anrede || "", sprache: m.sprache || "de" })}
                                    className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1.5px solid var(--ig-gray2)" }}>✎</button>
                                  <button onClick={() => deleteMember(m.id)}
                                    className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "var(--ig-light)", color: "#dc2626", border: "1.5px solid var(--ig-gray2)" }}>
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
                ) : (
                  <p className="px-4 py-3 text-xs" style={{ color: "var(--ig-gray3)" }}>Noch keine Mitglieder.</p>
                )}

                {/* Add member row */}
                <div className="px-4 py-3" style={{ borderTop: "1px solid var(--ig-gray2)" }}>
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
                      <div className="flex gap-2">
                        <button disabled={adding || !newMember.first_name || !newMember.last_name || !newMember.email}
                          onClick={() => addMember(zg.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                          style={{ background: "var(--ig-navy)", color: "white" }}>
                          {adding ? "Wird hinzugefügt…" : "Hinzufügen"}
                        </button>
                        <button onClick={() => setNewMember(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--ig-light)", color: "var(--ig-gray3)", border: "1.5px solid var(--ig-gray2)" }}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setNewMember(emptyNew())}
                      className="text-xs font-medium flex items-center gap-1.5"
                      style={{ color: "var(--ig-gold)" }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Mitglied hinzufügen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Create new Zielgruppe */}
      <div className="flex gap-2 pt-1">
        <input className={inputCls} style={{ ...inputStyle, flex: 1 }} placeholder="Neue Zielgruppe…"
          value={newZGName} onChange={e => setNewZGName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") createZG(); }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--ig-navy)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--ig-gray2)")} />
        <button disabled={creatingZG || !newZGName.trim()} onClick={createZG}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ background: "var(--ig-navy)", color: "white" }}>
          {creatingZG ? "…" : "Erstellen"}
        </button>
      </div>
    </div>
  );
}
