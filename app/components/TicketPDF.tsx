import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Lang } from "@/lib/i18n";

const PDF_STRINGS = {
  en: { date: "Date", location: "Location", guest: "Guest", scanHint: "Please show this QR code at the entrance · impactgstaad.ch", placeholder: "The programme for this event will be announced shortly." },
  de: { date: "Datum", location: "Ort", guest: "Gast", scanHint: "Bitte zeige diesen QR-Code am Eingang · impactgstaad.ch", placeholder: "Das Programm für diesen Event wird in Kürze bekannt gegeben." },
  fr: { date: "Date", location: "Lieu", guest: "Invité", scanHint: "Veuillez montrer ce QR code à l'entrée · impactgstaad.ch", placeholder: "Le programme de cet événement sera annoncé prochainement." },
} as const;

const C = {
  navy:  "#1E3263",
  gold:  "#D28D28",
  black: "#26292F",
  light: "#F8F9FF",
  gray2: "#D0DDEA",
  gray3: "#5C7A94",
  white: "#FFFFFF",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    padding: 0,
  },

  // ── TICKET STUB ─────────────────────────────────────────────────────────────
  stub: { backgroundColor: C.white },

  header: {
    backgroundColor: C.light,
    paddingHorizontal: 36,
    paddingTop: 36,
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { height: 32, objectFit: "contain", objectPositionX: 0 },
  eventNameBlock: { flex: 1, paddingHorizontal: 24, alignItems: "flex-end" },
  eventEyebrow: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.gold, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "right", marginBottom: 4 },
  eventName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.navy, textAlign: "right" },

  goldBar: { height: 3, backgroundColor: C.gold },

  infoRow: { flexDirection: "row", paddingHorizontal: 36, paddingTop: 28, paddingBottom: 28 },
  infoCell: { flex: 1, paddingRight: 16, borderRight: `1pt solid ${C.gray2}`, marginRight: 16 },
  infoCellLast: { flex: 1, paddingRight: 0 },
  infoLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.gray3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.navy, lineHeight: 1.35 },
  infoValueLarge: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy },

  qrBlock: { alignItems: "center", justifyContent: "center" },
  qrCode: { width: 90, height: 90 },
  tokenText: { fontSize: 7, color: C.gray3, fontFamily: "Courier", marginTop: 4, textAlign: "center" },

  scanHint: { backgroundColor: C.light, paddingHorizontal: 36, paddingVertical: 8 },
  scanHintText: { fontSize: 8, color: C.navy },

  // ── PERFORATION ─────────────────────────────────────────────────────────────
  perforation: { borderTop: `1.5pt dashed ${C.gray2}` },

  // ── PROGRAM SECTION ─────────────────────────────────────────────────────────
  program: { flex: 1, paddingHorizontal: 36, paddingTop: 24, paddingBottom: 48 },

  // Parsed content styles
  sectionHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 12,
  },
  bodyLine: {
    fontSize: 9.5,
    color: C.black,
    lineHeight: 1.6,
    fontFamily: "Helvetica",
  },
  keyLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  keyValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: C.black,
  },
  timeLine: {
    fontSize: 9.5,
    color: C.black,
    lineHeight: 1.6,
    fontFamily: "Helvetica",
  },
  timeCode: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  emptyLine: { marginBottom: 5 },
  placeholder: { fontSize: 10, color: C.navy, lineHeight: 1.7, fontStyle: "italic" },

  // Structured "Zeitplan" program block (reused from the campaign builder)
  slot: { marginBottom: 12, paddingLeft: 10, borderLeft: `2pt solid ${C.gold}` },
  slotBreak: { marginVertical: 8, alignItems: "center" },
  slotBreakText: { fontSize: 8.5, color: C.gray3, fontFamily: "Helvetica" },
  subItem: { marginTop: 4 },
  subItemTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.black },
  subItemSpeaker: { fontSize: 9, color: C.navy, marginTop: 1 },
  slotNote: { fontSize: 9, color: C.navy, marginTop: 4, fontStyle: "italic" },

  // Footer
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: C.navy },
});

// ── Simple text parser ────────────────────────────────────────────────────────
// ## Heading       → navy bold uppercase
// 13:30 - 14:00 …  → time entries (bold time, normal text)
// blank line        → small spacer
// everything else  → body text

type ParsedLine =
  | { type: "heading"; text: string }
  | { type: "time"; time: string; label: string }
  | { type: "keyvalue"; key: string; value: string }
  | { type: "body"; text: string }
  | { type: "empty" };

function parseDescription(raw: string): ParsedLine[] {
  return raw.split("\n").map((line): ParsedLine => {
    const trimmed = line.trim();
    if (!trimmed) return { type: "empty" };
    if (trimmed.startsWith("## ")) return { type: "heading", text: trimmed.slice(3) };
    const timeMatch = trimmed.match(/^(\d{1,2}:\d{2}(?:\s*[-–]\s*\d{1,2}:\d{2})?)\s{2,}(.+)$/);
    if (timeMatch) return { type: "time", time: timeMatch[1].trim(), label: timeMatch[2].trim() };
    const kvMatch = trimmed.match(/^([A-Za-z][^:]{1,30}):\s+(.+)$/);
    if (kvMatch) return { type: "keyvalue", key: kvMatch[1], value: kvMatch[2] };
    return { type: "body", text: trimmed };
  });
}

function ProgramContent({ description }: { description: string }) {
  const lines = parseDescription(description);
  return (
    <>
      {lines.map((line, i) => {
        if (line.type === "empty") return <View key={i} style={s.emptyLine} />;
        if (line.type === "heading") return <Text key={i} style={s.sectionHeading}>{line.text}</Text>;
        if (line.type === "keyvalue") return (
          <Text key={i} style={s.bodyLine}>
            <Text style={s.keyLabel}>{line.key}: </Text>
            <Text style={s.keyValue}>{line.value}</Text>
          </Text>
        );
        if (line.type === "time") return (
          <View key={i} style={{ flexDirection: "row" }}>
            <Text style={[s.timeCode, { width: 90, flexShrink: 0 }]}>{line.time}</Text>
            <Text style={s.timeLine}>{line.label}</Text>
          </View>
        );
        return <Text key={i} style={s.bodyLine}>{line.text}</Text>;
      })}
    </>
  );
}

type ProgramSlot = {
  id: string;
  time: string;
  title: string;
  sub_items: { id: string; title: string; speaker: string }[];
  note: string;
  is_break?: boolean;
};

function ProgramSlotsContent({ title, slots }: { title?: string; slots: ProgramSlot[] }) {
  return (
    <>
      {title ? <Text style={s.sectionHeading}>{title}</Text> : null}
      {slots.map(slot => {
        if (slot.is_break) {
          const label = [slot.title, slot.time].filter(Boolean).join(" · ");
          return label ? (
            <View key={slot.id} style={s.slotBreak}><Text style={s.slotBreakText}>{label}</Text></View>
          ) : null;
        }
        const subItems = slot.sub_items.filter(si => si.title || si.speaker);
        return (
          <View key={slot.id} style={s.slot}>
            {slot.time ? <Text style={s.timeCode}>{slot.time}</Text> : null}
            {slot.title ? <Text style={s.bodyLine}>{slot.title}</Text> : null}
            {subItems.map(si => (
              <View key={si.id} style={s.subItem}>
                {si.title ? <Text style={s.subItemTitle}>{si.title}</Text> : null}
                {si.speaker ? <Text style={s.subItemSpeaker}>{si.speaker}</Text> : null}
              </View>
            ))}
            {slot.note ? <Text style={s.slotNote}>{slot.note}</Text> : null}
          </View>
        );
      })}
    </>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  guestName: string;
  token: string;
  qrDataUrl: string;
  logoUrl: string;
  lang?: Lang;
  event: {
    name: string;
    date: string;
    location: string;
    category?: string | null;
    program?: string | null;
    programTitle?: string;
    programSlots?: ProgramSlot[];
  };
};

const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", de: "de-DE", fr: "fr-FR" };

// ── PDF Document ──────────────────────────────────────────────────────────────
export function TicketPDF({ guestName, token, qrDataUrl, logoUrl, event, lang = "en" }: Props) {
  const t = PDF_STRINGS[lang];
  const eventDate = new Date(event.date).toLocaleDateString(DATE_LOCALE[lang], {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Document title={`Ticket — ${guestName}`} author="Impact Gstaad">
      <Page size="A4" style={s.page}>

        {/* ── TICKET STUB ── */}
        <View style={s.stub}>
          <View style={s.header}>
            <Image src={logoUrl} style={s.logo} />
            <View style={s.eventNameBlock}>
              {event.category ? <Text style={s.eventEyebrow}>{event.category}</Text> : null}
              <Text style={s.eventName}>{event.name}</Text>
            </View>
          </View>

          <View style={s.goldBar} />

          <View style={s.infoRow}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>{t.date}</Text>
              <Text style={s.infoValue}>{eventDate}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>{t.location}</Text>
              <Text style={s.infoValue}>{event.location}</Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>{t.guest}</Text>
              <Text style={s.infoValueLarge}>{guestName}</Text>
            </View>
            <View style={s.qrBlock}>
              <Image src={qrDataUrl} style={s.qrCode} />
            </View>
          </View>

          <View style={s.scanHint}>
            <Text style={s.scanHintText}>{t.scanHint}</Text>
          </View>
        </View>

        {/* ── PERFORATION ── */}
        <View style={s.perforation} />

        {/* ── PROGRAM ── */}
        <View style={s.program}>
          {event.programSlots ? (
            <ProgramSlotsContent title={event.programTitle} slots={event.programSlots} />
          ) : event.program ? (
            <ProgramContent description={event.program} />
          ) : (
            <Text style={s.placeholder}>{t.placeholder}</Text>
          )}
        </View>

        {/* ── FOOTER ── */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>impactgstaad.ch</Text>
          <Text style={s.footerText}>{event.name} · {guestName}</Text>
        </View>

      </Page>
    </Document>
  );
}
