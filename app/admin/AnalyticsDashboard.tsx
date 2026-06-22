"use client";
import { useEffect, useState } from "react";

type AnalyticsData = {
  members: {
    total: number;
    unsubscribed: number;
    byZielgruppe: [string, number][];
    bySprache: [string, number][];
    byAnrede: [string, number][];
  };
  inviteCodes: { total: number; used: number };
  campaigns: {
    total: number;
    totalRecipients: number;
    list: { id: string; title: string; lang: string | null; sent_at: string; recipient_count: number; zielgruppe: string | null; opens: number; clicks: number; open_rate: number | null; click_rate: number | null }[];
  };
  registrations: {
    total: number;
    checkedIn: number;
    byHour: { hour: number; count: number }[];
  };
};

function Bar({ value, max, color = "var(--ig-navy)" }: { value: number; max: number; color?: string }) {
  return (
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--ig-light)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }} />
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
      <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1" style={{ color: "var(--ig-gray3)" }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: "var(--ig-navy)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--ig-gray3)" }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--ig-gray2)" }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "var(--ig-gray2)" }}>
        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--ig-navy)" }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function BarList({ items, color }: { items: [string, number][]; color?: string }) {
  const max = Math.max(...items.map(([, v]) => v), 1);
  return (
    <div className="space-y-2.5">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs w-28 shrink-0 truncate" style={{ color: "var(--ig-navy)" }}>{label}</span>
          <Bar value={value} max={max} color={color} />
          <span className="text-xs font-semibold w-8 text-right shrink-0" style={{ color: "var(--ig-gray3)" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function HourChart({ data }: { data: { hour: number; count: number }[] }) {
  if (data.length === 0) return <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>Noch keine Check-ins.</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: data.find(d => d.hour === i)?.count ?? 0 }));
  const active = hours.filter(h => h.count > 0);
  const minH = Math.max(0, (active[0]?.hour ?? 8) - 1);
  const maxH = Math.min(23, (active[active.length - 1]?.hour ?? 20) + 1);
  const visible = hours.slice(minH, maxH + 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-20">
        {visible.map(({ hour, count }) => (
          <div key={hour} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t transition-all duration-500" style={{ height: `${(count / max) * 64}px`, background: count > 0 ? "var(--ig-navy)" : "var(--ig-light)", minHeight: count > 0 ? 4 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {visible.map(({ hour }) => (
          <div key={hour} className="flex-1 text-center" style={{ fontSize: 10, color: "var(--ig-gray3)" }}>{hour}h</div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({ eventId, adminPassword }: { eventId: string; adminPassword: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?eventId=${eventId}&password=${encodeURIComponent(adminPassword)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [eventId, adminPassword]);

  if (loading) return (
    <div className="py-16 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>Statistiken werden geladen…</div>
  );
  if (!data) return null;

  const codeRate = data.inviteCodes.total > 0 ? Math.round((data.inviteCodes.used / data.inviteCodes.total) * 100) : 0;
  const checkinRate = data.registrations.total > 0 ? Math.round((data.registrations.checkedIn / data.registrations.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Mitglieder" value={data.members.total} sub={data.members.unsubscribed > 0 ? `${data.members.unsubscribed} abgemeldet` : undefined} />
        <KPI label="Codes genutzt" value={`${codeRate}%`} sub={`${data.inviteCodes.used} / ${data.inviteCodes.total}`} />
        <KPI label="Kampagnen" value={data.campaigns.total} sub={`${data.campaigns.totalRecipients} Versände total`} />
        <KPI label="Check-in Rate" value={`${checkinRate}%`} sub={`${data.registrations.checkedIn} / ${data.registrations.total} Gäste`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Zielgruppen */}
        {data.members.byZielgruppe.length > 0 && (
          <Section title="Mitglieder nach Zielgruppe">
            <BarList items={data.members.byZielgruppe} color="var(--ig-navy)" />
          </Section>
        )}

        {/* Sprache */}
        {data.members.bySprache.length > 0 && (
          <Section title="Mitglieder nach Sprache">
            <BarList items={data.members.bySprache} color="var(--ig-gold)" />
          </Section>
        )}

        {/* Anrede */}
        {data.members.byAnrede.length > 0 && (
          <Section title="Mitglieder nach Anrede">
            <BarList items={data.members.byAnrede} color="#6366f1" />
          </Section>
        )}

        {/* Check-in Timeline */}
        {data.registrations.byHour.length > 0 && (
          <Section title="Check-in Zeitverlauf">
            <HourChart data={data.registrations.byHour} />
          </Section>
        )}
      </div>

      {/* Kampagnen-Liste */}
      {data.campaigns.list.length > 0 && (
        <Section title="Gesendete Kampagnen">
          <div className="space-y-2">
            {data.campaigns.list.map(c => (
              <div key={c.id} className="py-3 border-b last:border-0" style={{ borderColor: "var(--ig-gray2)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--ig-navy)" }}>{c.title}</p>
                    <p className="text-xs" style={{ color: "var(--ig-gray3)" }}>
                      {new Date(c.sent_at).toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "numeric" })}
                      {c.zielgruppe && <> · {c.zielgruppe}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.lang && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--ig-light)", color: "var(--ig-navy)", border: "1px solid var(--ig-gray2)" }}>
                        {c.lang.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: "var(--ig-gold)" }}>{c.recipient_count} ✉</span>
                  </div>
                </div>
                {c.recipient_count > 0 && (
                  <div className="flex gap-4 mt-2">
                    <div>
                      <span className="text-xs" style={{ color: "var(--ig-gray3)" }}>Öffnungen </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--ig-navy)" }}>
                        {c.open_rate !== null ? `${c.open_rate}%` : "—"}
                        {c.opens > 0 && <span style={{ color: "var(--ig-gray3)", fontWeight: 400 }}> ({c.opens})</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: "var(--ig-gray3)" }}>Klicks </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--ig-navy)" }}>
                        {c.click_rate !== null ? `${c.click_rate}%` : "—"}
                        {c.clicks > 0 && <span style={{ color: "var(--ig-gray3)", fontWeight: 400 }}> ({c.clicks})</span>}
                      </span>
                    </div>
                    {c.open_rate !== null && (
                      <div className="flex-1 flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ig-light)" }}>
                          <div className="h-full rounded-full" style={{ width: `${c.open_rate}%`, background: "var(--ig-navy)", transition: "width 0.5s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.campaigns.list.length === 0 && data.members.total === 0 && (
        <div className="py-12 text-center text-sm" style={{ color: "var(--ig-gray3)" }}>
          Noch keine Daten für diesen Event.
        </div>
      )}
    </div>
  );
}
