# UI/UX-Befundbericht — Impact Gstaad Registration App

**Analysemethode:** Code-Review aller UI-relevanten Dateien (App Router, Komponenten, Styling) + Live-Test im Dev-Server (Login, Ticket-Seite, mobile Ansicht 375px). Hinweis: Die lokale `.env.local` verweist auf keine erreichbare Supabase-Instanz, daher liefern `/api/admin/events`, `/api/registrations` etc. im Dev-Server 500-Fehler — dies hat sich als **eigener Befund** erwiesen (fehlender Error-State), war aber auch der Grund, warum echte Registrierungs-/Kampagnendaten nicht live durchgeklickt werden konnten. Ein Teil der Befunde stützt sich daher auf Code-Analyse statt auf Live-Beobachtung; das ist an den jeweiligen Stellen vermerkt.

**Scope:** Public-Flows (Registrierung, Ticket, Success, Unsubscribe) und Admin-Bereich (Events, Kampagnen, Zielgruppen, Analytics, Scanner) — ohne die visuelle Gestaltung von `PreviewPanel.tsx` selbst, die laut Vorgabe unangetastet bleibt.

---

## Zusammenfassung

Das Fundament ist solide: konsistente Design-Tokens (`globals.css`), durchdachte Performance-Patterns (Lazy-Loading der schweren Editor-Bundles, serverseitiges Event-Preloading), ein bewusst implementiertes Fokus-System und ein bereits vorhandenes `ConfirmDialog`-Pattern für destruktive Aktionen. Die App ist an vielen Stellen bereits besser gebaut, als ein erster Blick vermuten lässt.

Die drei wirksamsten Verbesserungen:

1. **Fehlende Error-States beheben** (Ticket-Seite, Admin-Ladefunktionen): Aktuell hängt die UI bei einem Serverfehler oder ungültigen Token dauerhaft im Lade-Skeleton — ohne jede Nutzerrückmeldung. Das betrifft potenziell jeden Gast mit einem kaputten Ticket-Link und jeden Admin bei einem Netzwerk-Hänger.
2. **Destruktive Aktionen ohne Bestätigung absichern**: Kampagnen und ganze Zielgruppen lassen sich mit einem einzigen Klick unwiderruflich löschen, obwohl das passende `ConfirmDialog`-Pattern im selben Projekt bereits existiert und woanders korrekt verwendet wird.
3. **Sprachbruch beheben**: Der Ticket-Link in der Bestätigungsmail gab die tatsächlich gewählte Sprache nicht weiter — ein Gast, der z.B. eine französische Bestätigungsmail erhielt, landete trotzdem auf einer englischen Ticket-Seite, weil der `lang`-Parameter im Link fehlte. Das PDF-Ticket war zusätzlich komplett hartkodiert Englisch, unabhängig von der gewählten Sprache. **Wichtig — Korrektur:** Der ursprüngliche Befund ging fälschlich davon aus, Deutsch sei die App-weite Primärsprache, und empfahl einen globalen Default-Wechsel von „en" auf „de". Das ist falsch: Die Kommunikation gegenüber Impact-Circle-Mitgliedern (Invite-Code-Flow) ist bewusst Englisch, gegenüber der Öffentlichkeit dreisprachig (DE/EN/FR nach Wahl), nur das Backend/Admin-UI ist Deutsch. Der Default-Fallback („en", wenn kein `lang`-Parameter vorhanden ist) muss so bleiben — behoben wurde nur das Weiterreichen des tatsächlich gewählten Werts.

---

## Befunde nach Priorität

### 🔴 Hoch (behindert Nutzung)

**1. Ticket-Seite hängt bei ungültigem Token für immer im Lade-Skeleton**
- Fundstelle: `app/ticket/[token]/page.tsx:25` (Fetch-Handler), API liefert bei unbekanntem Token 404 mit `{error: "..."}`; da `d.error` gesetzt ist, wird `setInfo` nie aufgerufen.
- Problem: Kein Error-Branch vorhanden. `info` bleibt `null`, die Skeleton-Platzhalter (Zeilen 71–75, 116–119, 138–139) werden endlos angezeigt.
- Auswirkung: Ein Gast mit abgelaufenem/falschem Ticket-Link sieht dauerhaft graue Ladebalken, ohne zu erfahren, dass etwas schiefgelaufen ist — Sackgasse ohne Call-to-Action (kein Link zurück, kein Kontakthinweis).
- Empfehlung: Dritten State `notFound` einführen, klare Fehlermeldung + Handlungsoption (z.B. Kontakt-Link) rendern.

**2. Admin-Ladefunktionen hängen bei Serverfehler dauerhaft auf „Lädt…“**
- Fundstelle: `app/admin/page.tsx:736–743` (`loadAllEvents`), `app/admin/page.tsx:727–734` (`loadRegistrations`), `app/admin/page.tsx:802–813` (Session-Restore), `AnalyticsDashboard.tsx:99–104`.
- Problem: Kein `try/catch` um Fetch/`res.json()`. Schlägt der Request fehl, wird `setEventsLoading(false)` nie erreicht; unhandled promise rejection in der Konsole.
- Auswirkung: Admin sieht bei jedem Netzwerk-/Serverfehler dauerhaft „Lädt…“ ohne Möglichkeit, es zu bemerken oder erneut zu versuchen (live im Dev-Server reproduziert).
- Empfehlung: Einheitliches `try/catch/finally` mit sichtbarem Error-State + „Erneut versuchen"-Button für alle Lade-Funktionen im Admin-Bereich.

**3. Kampagne löschen ohne jede Bestätigung**
- Fundstelle: `app/admin/page.tsx:475–479` (Löschen-Icon-Button ruft direkt `onDelete(c.id)` → `DELETE /api/campaigns/${id}`, Zeilen 3107, 3130).
- Problem: Kein Confirm-Dialog, obwohl die Komponente `ConfirmDialog` im selben File existiert (Zeilen 145–174) und für Event-/Mitglied-Löschung korrekt verwendet wird.
- Auswirkung: Ein Fehlklick löscht unwiderruflich eine Kampagne (inkl. Historie versendeter Mails).
- Empfehlung: `ConfirmDialog` auch hier einbinden, analog zur Event-Löschung.

**4. Zielgruppe löschen ohne Bestätigung**
- Fundstelle: `ZielgruppenDashboard.tsx:298–302` (`onClick={() => deleteZG(zg.id)}`).
- Problem: Direktes Löschen ohne Dialog, während das Löschen eines einzelnen Mitglieds direkt daneben korrekt über `deleteConfirm`/Dialog abgesichert ist (Zeile 412, 220–238).
- Auswirkung: Eine ganze Empfängerliste ist mit einem Klick weg.
- Empfehlung: Gleiches `ConfirmDialog`-Pattern anwenden.

**5. Sprachbruch: Ticket-Link in der Bestätigungsmail gibt die gewählte Sprache nicht weiter**
- Fundstelle: `lib/email.ts:111` (Ticket-Link ohne `?lang=`-Parameter gebaut), obwohl `sendConfirmationEmail(..., lang)` (`lib/email.ts:37`) die tatsächliche Sprache der Anmeldung kennt.
- Problem: Ticket-Link in der E-Mail gibt die Sprache nicht weiter; Ticket-Seite fällt in diesem Fall auf den App-Default zurück statt auf die tatsächlich gewählte Sprache.
- Auswirkung: Gäste landen ggf. auf einer Ticket-Seite in der falschen Sprache — live im Dev-Server bestätigt.
- Empfehlung: `?lang=${lang}` in den E-Mail-Link einbauen (Fix umgesetzt).
- **Korrektur (nachträglich vom Auftraggeber bestätigt):** Der App-Default `"en"` (`lib/i18n.ts:3–7`, `getLang()`) ist **korrekt und muss so bleiben** — Impact-Circle-Mitglieder (Invite-Code-Flow) werden bewusst auf Englisch angesprochen, die Öffentlichkeit dreisprachig nach eigener Wahl, nur das Backend/Admin-UI ist Deutsch. Ein früherer Zwischenstand dieses Fixes hatte den Default fälschlich auf „de" gedreht — das wurde zurückgenommen; nur das Weiterreichen des `lang`-Werts bleibt als Fix bestehen.

**6. Ticket-Seite als Sackgasse (Navigations-Perspektive derselben Ursache wie #1)**
- Fundstelle: `app/ticket/[token]/page.tsx` — kein Error-Branch, kein Link zurück zur Startseite, kein Kontakthinweis.
- Empfehlung: Siehe #1 — im selben Zug lösen.

### 🟡 Mittel (spürbar)

- **PIN-Eingabe als `type="number"`** (`app/scan/[eventId]/page.tsx:223`): Führende Nullen in PINs können verloren gehen. → `type="text"` mit `inputMode="numeric"` + `pattern="[0-9]*"`, State als String führen.
- **Icon-Buttons unter 44×44px Touch-Ziel:** Kampagnen-Löschen (`app/admin/page.tsx:475–479`, ~28×28px), Event-Listen-Aktionen (`app/admin/page.tsx:1756–1799`), `ZielgruppenDashboard.tsx:18` (`btnIcon`, 36×36px). Gerade der Scanner wird oft auf Tablets/Smartphones vor Ort bedient.
- **Hover-only sichtbare Aktions-Icons in der Eventliste** (`app/admin/page.tsx:1754`, `opacity-0 group-hover:opacity-100`): Auf Touch-Geräten ohne Hover-State faktisch nur über einen „blinden" ersten Tap erreichbar — verletzt das ≤2-Tap-Prinzip für häufige Aufgaben (Scanner-Link kopieren, Duplizieren, Archivieren).
- **Login ohne Ladezustand/Fehlerbehandlung** (`app/admin/page.tsx:815–826`, Button Zeile 1124): Kein `disabled` während des Requests, kein Spinner, keine generische Fehlermeldung bei Netzwerkfehler (nur 401 wird behandelt) — im Gegensatz zu praktisch allen anderen Formularen der App.
- **CSV-Import ohne Vorschau** (`ZielgruppenDashboard.tsx:121–162`): Datei wird direkt hochgeladen, Fehler (fehlende Spalten) erst danach sichtbar. Für einen Massenimport in einen E-Mail-Verteiler fehlt eine Vorschau/Bestätigung vor dem Absenden.
- **Block in Kampagne entfernen ohne Bestätigung** (`CampaignBuilder.tsx:733–736`): Entschärft durch Undo (⌘Z), aber Undo ist nicht offensichtlich auffindbar.
- **`app/unsubscribe/page.tsx` komplett hartkodiert Englisch** (Zeilen 14–19), obwohl das i18n-System (`lib/i18n.ts`) im Rest der App genutzt wird.
- **`TicketPDF.tsx` komplett Englisch** (Zeilen 209–226, 238: "Date", "Location", "Guest", Programm-Platzhaltertext) — unabhängig von Sprache, im Gegensatz zur Online-Ticket-Seite und E-Mail.
- **Icon-only-Buttons ohne `aria-label`**: `app/admin/page.tsx:475–479`, `ZielgruppenDashboard.tsx:295–301` (nur `title`, das von Screenreadern nicht zuverlässig vorgelesen wird), `CampaignBuilder.tsx:733–736`.
- **Formularfelder ohne `<label for>`-Verknüpfung** (`app/RegistrationForm.tsx:291–306` und durchgängig im Admin-Bereich): Label und Input nur visuell, nicht semantisch verbunden (`htmlFor`/`id` fehlt).

### 🟢 Tief (Politur)

- Zwei leicht unterschiedliche Graupaletten in App (`globals.css:4–9`) vs. E-Mail-Templates (`email-design.ts:2`).
- Zwei parallele Icon-Systeme im Admin (SVG-Icon-Set in `page.tsx:26–96` vs. Unicode-Zeichen ✎✕↩↑↓⠿ in `ZielgruppenDashboard.tsx`, `CampaignBuilder.tsx`).
- Native Browser-Dialoge (`confirm`, `prompt`, `alert`) neben custom `ConfirmDialog`: `scan/[eventId]/page.tsx:164`, `CampaignBuilder.tsx:100,460,463`.
- Kampagnen-Löschen ohne Text-Label (nur Icon), während Event-/Mitglied-Löschung textbeschriftet sind.
- Neue Kampagne startet default in Englisch (`CampaignBuilder.tsx:838`) statt Deutsch.
- Rohes Ticket-Token wird im UI angezeigt (`app/ticket/[token]/page.tsx:141–143`, `{token?.substring(0,8)}…`) — unnötige interne-ID-Preisgabe, live beobachtet.
- Kein visueller Hinweis auf horizontales Scrollen in der Zielgruppen-Tabelle (`ZielgruppenDashboard.tsx:347`).
- Statischer globaler Seitentitel für alle Routen (`app/layout.tsx:12–15`) — Browser-Tabs von Admin/Scanner/Ticket nicht unterscheidbar.
- Heller Platzhaltertext unter WCAG-AA-Kontrast in Editor-Hilfetexten (`CampaignBuilder.tsx:628`, ~2.6:1) — betrifft nur Platzhalter, nicht Primärinhalt.
- Custom-Kategorie-Auswahl in `CampaignBuilder.tsx:182–201` kann bei Hin-und-Herwechseln unbemerkt Eingaben verlieren.
- Analytics-Leerzustand greift nur, wenn *beide* Kennzahlen (Kampagnen und Mitglieder) leer sind — Teil-Leerfälle zeigen nur Nullen ohne Hinweistext (`AnalyticsDashboard.tsx:208`).
- Keine Listen-Virtualisierung bei sehr grossen Mitglieder-/Registrierungstabellen — aktuell unproblematisch, als Beobachtung für die Zukunft vermerkt.
- Live-Suche in Zielgruppen-Tabelle ohne Debounce (`ZielgruppenDashboard.tsx:64–70`) — aktuell unkritisch.

---

## Was bereits gut ist — bitte nicht "mitverbessern"

- **Design-Tokens in `app/globals.css:3–10`** (`--ig-navy`, `--ig-gold` etc.) werden konsequent im gesamten Public-Bereich verwendet.
- **Fokus-Styles** (`globals.css:12–23`): bewusst nur `:focus-visible`, mit begründendem Kommentar zur Koexistenz mit inline `onFocus`.
- **iOS-Zoom-Prevention** (`globals.css:30–35`, `font-size:16px` unter 640px).
- **Zweistufige Bestätigung beim Kampagnenversand** (`app/admin/page.tsx:434–465`) — vorbildliches Muster für irreversible Aktionen.
- **Autosave mit klarem Status-Text** in CampaignBuilder (Zeilen 950–986, 1120f.) — Timing und Statusanzeige gut balanciert.
- **Undo (⌘Z) im Campaign-Builder** (Zeilen 866–882).
- **Lazy-Loading der schweren Editor-Bundles** (`app/admin/page.tsx:6–12`, dokumentierte Begründung) — sehr gute Performance-Praxis.
- **Serverseitiges Preloading des Events** auf der Registrierungsseite (`app/page.tsx:6–26`).
- **`ConfirmDialog`-Pattern** (`app/admin/page.tsx:145–174`, `ZielgruppenDashboard.tsx:220–238`) — das Pattern selbst ist richtig, muss nur konsequenter angewendet werden (siehe Hoch-Prio-Befunde).
- **Konsistente `inputClass`/`inputStyle`** (`app/admin/page.tsx:99–100`) im gesamten Admin-Formularbereich.
- **Datenerhalt bei Formularfehlern**: Eingaben werden nirgends zurückgesetzt (Registrierung, manuelle Erfassung im Scanner, Mitglied hinzufügen).
- **Scanner-UI mit klaren Farbzuständen** (grün/gelb/rot, `scan/[eventId]/page.tsx:295–309`) — sofort verständliches Feedback.
- **Mobile-Viewport-Handling im Scanner** (`calc(100svh - 220px)`, Zeile 273) — korrektes Pattern für mobile Adressleisten.
- **`PreviewPanel.tsx`-Design** — laut Vorgabe unangetastet lassen, ist Referenz.

---

## Hinweis zur Testabdeckung

Diese Analyse basiert primär auf Code-Review; ein Teil der Live-Flows (Registrierung mit echten Daten, Kampagnen-Versand, Zielgruppen-Verwaltung mit realen Mitgliedern) konnte im Dev-Server nicht durchgeklickt werden, da die lokale `.env.local` keine erreichbare Supabase-Instanz referenziert (500-Fehler auf allen datengebundenen Endpunkten — siehe Befund „Admin-Ladefunktionen hängen..."). Vor der Umsetzung empfiehlt sich ein kurzer manueller Test der Kernflows mit echten/Staging-Daten, um die hier gelisteten Annahmen zu bestätigen.
