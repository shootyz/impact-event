import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const C = {
  navy:  "#1E3263",
  gold:  "#D28D28",
  black: "#26292F",
  light: "#F8F9FF",
  gray2: "#D0DDEA",
  gray3: "#A7C4DE",
  white: "#FFFFFF",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    padding: 0,
  },

  // ── TICKET STUB ─────────────────────────────────────────────────────────────

  stub: {
    backgroundColor: C.white,
  },

  // Navy header band
  header: {
    backgroundColor: C.light,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    height: 32,
    objectFit: "contain",
    objectPositionX: 0,
  },
  eventNameBlock: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "flex-end",
  },
  eventName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    textAlign: "right",
  },

  // Gold bar
  goldBar: {
    height: 3,
    backgroundColor: C.gold,
  },

  // Info row: date / location / guest / QR
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 0,
  },
  infoCell: {
    flex: 1,
    paddingRight: 16,
    borderRight: `1pt solid ${C.gray2}`,
    marginRight: 16,
  },
  infoCellLast: {
    flex: 1,
    paddingRight: 0,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gray3,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    lineHeight: 1.35,
  },
  infoValueLarge: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },

  // QR block in info row
  qrBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrCode: {
    width: 90,
    height: 90,
  },
  tokenText: {
    fontSize: 7,
    color: C.gray3,
    fontFamily: "Courier",
    marginTop: 4,
    textAlign: "center",
  },

  // Scan hint
  scanHint: {
    backgroundColor: C.light,
    paddingHorizontal: 36,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scanHintText: {
    fontSize: 8,
    color: C.gray3,
    fontFamily: "Helvetica",
  },

  // ── PERFORATION ─────────────────────────────────────────────────────────────
  perforation: {
    marginHorizontal: 0,
    borderTop: `1.5pt dashed ${C.gray2}`,
    marginVertical: 0,
  },

  // ── PROGRAM SECTION ─────────────────────────────────────────────────────────
  program: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 36,
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  programGoldLine: {
    width: 28,
    height: 2,
    backgroundColor: C.gold,
  },
  programTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  programContent: {
    fontSize: 10,
    color: C.navy,
    lineHeight: 1.7,
    fontFamily: "Helvetica",
  },
  programPlaceholder: {
    fontSize: 10,
    color: C.gray3,
    lineHeight: 1.7,
    fontStyle: "italic",
  },

  // Footer
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: C.gray2,
    fontFamily: "Helvetica",
  },
});

type Props = {
  guestName: string;
  token: string;
  qrDataUrl: string;
  logoUrl: string;
  event: {
    name: string;
    date: string;
    location: string;
    description?: string | null;
  };
};

export function TicketPDF({ guestName, token, qrDataUrl, logoUrl, event }: Props) {
  const eventDate = new Date(event.date).toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Document title={`Ticket — ${guestName}`} author="Impact Gstaad">
      <Page size="A4" style={s.page}>

        {/* ── TICKET STUB ── */}
        <View style={s.stub}>

          {/* Navy header: logo + event name */}
          <View style={s.header}>
            <Image src={logoUrl} style={s.logo} />
            <View style={s.eventNameBlock}>
              <Text style={s.eventName}>{event.name}</Text>
            </View>
          </View>

          {/* Gold accent bar */}
          <View style={s.goldBar} />

          {/* Info row */}
          <View style={s.infoRow}>
            {/* Date */}
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Date</Text>
              <Text style={s.infoValue}>{eventDate}</Text>
            </View>

            {/* Location */}
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Location</Text>
              <Text style={s.infoValue}>{event.location}</Text>
            </View>

            {/* Guest */}
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>Guest</Text>
              <Text style={s.infoValueLarge}>{guestName}</Text>
            </View>

            {/* QR */}
            <View style={s.qrBlock}>
              <Image src={qrDataUrl} style={s.qrCode} />
              <Text style={s.tokenText}>{token.substring(0, 8)}…</Text>
            </View>
          </View>

          {/* Scan hint */}
          <View style={s.scanHint}>
            <Text style={s.scanHintText}>Please show this QR code at the entrance · impactgstaad.ch</Text>
          </View>
        </View>

        {/* ── PERFORATION LINE ── */}
        <View style={s.perforation} />

        {/* ── PROGRAM SECTION ── */}
        <View style={s.program}>
          <View style={s.programHeader}>
            <View style={s.programGoldLine} />
            <Text style={s.programTitle}>Programme</Text>
          </View>

          {event.description ? (
            <Text style={s.programContent}>{event.description}</Text>
          ) : (
            <Text style={s.programPlaceholder}>
              The programme for this event will be announced shortly.
            </Text>
          )}
        </View>

        {/* ── PAGE FOOTER ── */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>impactgstaad.ch</Text>
          <Text style={s.footerText}>{event.name} · {guestName}</Text>
        </View>

      </Page>
    </Document>
  );
}
