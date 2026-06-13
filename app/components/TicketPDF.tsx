import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

// ─── Brand colors ─────────────────────────────────────────────────────────────
const C = {
  navy:  "#1E3263",
  gold:  "#D28D28",
  black: "#26292F",
  light: "#F8F9FF",
  gray2: "#D0DDEA",
  gray3: "#A7C4DE",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.light,
    fontFamily: "Helvetica",
    padding: 32,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    border: `1pt solid ${C.gray2}`,
    overflow: "hidden",
  },
  goldBar: {
    height: 3,
    backgroundColor: C.gold,
  },
  header: {
    padding: "20 24 16 24",
    borderBottom: `1pt solid ${C.gray2}`,
  },
  logo: {
    height: 28,
    objectFit: "contain",
    objectPositionX: 0,
    marginBottom: 12,
  },
  eventName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 9,
    color: C.gray3,
    marginBottom: 2,
  },
  body: {
    padding: "16 24 20 24",
  },
  ticketForLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray3,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  guestName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  tokenText: {
    fontSize: 8,
    color: C.gray3,
    textAlign: "center",
    fontFamily: "Courier",
    marginTop: 8,
  },
  footer: {
    borderTop: `1pt solid ${C.gray2}`,
    padding: "10 24",
  },
  footerText: {
    fontSize: 9,
    color: C.gray3,
    textAlign: "center",
  },
});

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  guestName: string;
  token: string;
  qrDataUrl: string;
  logoUrl: string;
  event: {
    name: string;
    date: string;
    location: string;
  };
};

// ─── PDF Document ─────────────────────────────────────────────────────────────
export function TicketPDF({ guestName, token, qrDataUrl, logoUrl, event }: Props) {
  const eventDate = new Date(event.date).toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Document title={`Ticket — ${guestName}`} author="Impact Gstaad">
      <Page size="A6" style={s.page}>
        <View style={s.card}>
          <View style={s.goldBar} />

          {/* Header: Logo + Event info */}
          <View style={s.header}>
            <Image src={logoUrl} style={s.logo} />
            <Text style={s.eventName}>{event.name}</Text>
            <Text style={s.eventMeta}>{eventDate}</Text>
            <Text style={s.eventMeta}>{event.location}</Text>
          </View>

          {/* Body: Guest + QR */}
          <View style={s.body}>
            <Text style={s.ticketForLabel}>Ticket for</Text>
            <Text style={s.guestName}>{guestName}</Text>
            <View style={s.qrContainer}>
              <Image src={qrDataUrl} style={s.qrCode} />
            </View>
            <Text style={s.tokenText}>{token.substring(0, 8)}…</Text>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Show this QR code at the entrance</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
