# Auftrag: UI/UX-Befunde umsetzen — Impact Gstaad Registration App

## Kontext

Dies ist eine Next.js 16 (App Router, Turbopack) + Tailwind v4 + Supabase App für Event-Registrierung, Ticketing und Kampagnen-Mailing ("Impact Gstaad"). Zwei Nutzergruppen: öffentliche Event-Teilnehmer (Registrierungsformular, Ticket-Ansicht, Success-Seite, Unsubscribe) und interne Admins (Event-/Kampagnenverwaltung, Zielgruppen, Analytics, QR-Scanner am Eingang).

Eine vorgelagerte UI/UX-Analyse (`ui-ux-befund.md` im Projektroot) hat konkrete Befunde mit Datei/Zeile identifiziert. Dieser Prompt bündelt sie in umsetzbare Arbeitspakete. Lies `ui-ux-befund.md` zuerst vollständig, bevor du beginnst — er enthält Begründungen, die hier nicht wiederholt werden.

## Leitplanken (unbedingt einhalten)

- **Nur UI/UX.** Keine Änderungen an Datenmodell, Business-Logik, API-Response-Verhalten oder DB-Schema. Wo ein Fix einen API-Response leicht anpassen würde (z.B. Error-Shape), nur so minimal wie nötig für den UI-Fix.
- **`app/admin/PreviewPanel.tsx` und das visuelle Design des Campaign-Builder-Previews sind tabu** — nicht verändern, das ist die Referenz. Die Editor-Bedienelemente drumherum (Buttons, Toolbar, Dialoge) dürfen angepasst werden.
- **Bestehende Design-Tokens/Komponenten erweitern, nichts parallel neu erfinden.** Insbesondere: das vorhandene `ConfirmDialog`-Pattern (`app/admin/page.tsx:145–174`) wiederverwenden statt einen neuen Dialog-Typ zu bauen; bestehende `inputClass`/`inputStyle`-Konventionen (`app/admin/page.tsx:99–100`) und CSS-Variablen aus `globals.css` weiterverwenden.
- **Keine neuen Dependencies ohne Rückfrage** (z.B. kein Toast-Library, kein neues Icon-Set, keine Virtualisierungs-Library — auch wenn im Befund als mögliche Zukunftsoption erwähnt).
- **"Bleibt so"-Liste beachten** (siehe unten) — diese Punkte NICHT anfassen, auch nicht "im Vorbeigehen verbessern".
- **Performance:** Jede Änderung, die die App langsamer machen könnte, braucht vorherige Rückfrage/Freigabe.
- **Sprachkonvention (verbindlich, vom Auftraggeber bestätigt):** Impact-Circle-Mitglieder (Invite-Code-Flow: `app/api/register`, `app/api/quick-register`, `app/api/admin/register`) werden auf **Englisch** angesprochen — das ist der korrekte App-Default (`lib/i18n.ts` `getLang()` fällt auf `"en"` zurück, `lib/email.ts` `sendConfirmationEmail` default `"en"`) und darf **nicht** auf Deutsch geändert werden. Die Öffentlichkeit (Formular-Events, allgemeine Kampagnen) ist **dreisprachig** (DE/EN/FR nach expliziter Wahl über `?lang=`) — diese explizite Auswahl muss weiterhin korrekt durchgereicht werden. Das Backend/Admin-UI selbst ist und bleibt **Deutsch** (hartkodierte Strings in `app/admin/*.tsx`, unabhängig vom `lib/i18n.ts`-System). Bei Zweifel an der i18n-Konvention: EN-Default für Guest-facing-Flows ohne expliziten `lang`-Parameter, nicht DE.

## "Bleibt so" — nicht verändern

- `PreviewPanel.tsx`-Design (Referenz).
- Design-Tokens in `app/globals.css:3–10` (CSS-Variablen `--ig-navy`, `--ig-gold` etc.).
- Fokus-Styles (`globals.css:12–23`, `:focus-visible`-Ring).
- iOS-Zoom-Prevention (`globals.css:30–35`).
- Zweistufige Bestätigung beim Kampagnenversand (`app/admin/page.tsx:434–465`).
- Autosave-Mechanik und Statusanzeige in CampaignBuilder (Zeilen 950–986, 1120f.) — Timing/Text nicht ändern.
- Undo (⌘Z) im Campaign-Builder (Zeilen 866–882).
- Lazy-Loading-Strategie der Editor-Bundles (`app/admin/page.tsx:6–12`).
- Serverseitiges Event-Preloading (`app/page.tsx:6–26`).
- `inputClass`/`inputStyle`-Konvention selbst (nur konsequenter anwenden, nicht neu gestalten).
- Scanner-Farbzustände (grün/gelb/rot) und mobiles Viewport-Handling (`scan/[eventId]/page.tsx:273, 295–309`).

---

## Arbeitspaket 1 — Fehlende Error-States (Priorität: hoch)

**Ziel:** Kein View bleibt bei einem Fehler dauerhaft im Lade-Zustand hängen; jeder Fehler ist für Nutzer/Admin sichtbar und wo sinnvoll mit einer Handlungsoption versehen.

**Betroffene Dateien:**
- `app/ticket/[token]/page.tsx` (Fetch um Zeile 25) — dritten State `notFound`/`error` einführen, statt nur `info: null | TicketInfo`.
- `app/success/[token]/page.tsx` (Fetch um Zeile 32) — analoges Fehler-Handling.
- `app/admin/page.tsx`: `loadAllEvents` (Zeilen 736–743), `loadRegistrations` (727–734), Session-Restore (802–813) — jeweils `try/catch/finally` ergänzen, `finally` setzt den Lade-Flag zuverlässig zurück, `catch` setzt einen sichtbaren Error-State.
- `app/admin/AnalyticsDashboard.tsx` (Zeilen 99–104) — gleiches Muster.

**Vorgehen:**
1. Für jede der genannten Ladefunktionen: `try/catch/finally` einführen, sodass der Loading-Flag in jedem Fall (Erfolg, HTTP-Fehler, Netzwerkfehler) zurückgesetzt wird.
2. Bei Fehler einen einfachen, mit bestehendem Stil konsistenten Error-Zustand rendern (Text + "Erneut versuchen"-Button, der die Ladefunktion erneut aufruft). Kein neues Component-System — an vorhandenen Empty-State-Mustern orientieren (z.B. `app/admin/page.tsx:1698` "Noch keine Events.").
3. Für `app/ticket/[token]/page.tsx` und `app/success/[token]/page.tsx`: bei 404/Fehler eine klare Meldung ("Dieses Ticket konnte nicht gefunden werden.") plus einen Link zurück zur Startseite bzw. Kontakthinweis rendern, statt der Skeleton-Platzhalter.

**Akzeptanzkriterien:**
- Ticket-Seite mit ungültigem Token zeigt innerhalb von 5 Sekunden eine klare Fehlermeldung statt endlosem Skeleton (Test: `/ticket/ungueltiger-token` aufrufen).
- Admin-Dashboard zeigt bei einem simulierten 500er/Netzwerkfehler (z.B. `.env.local` mit ungültiger Supabase-URL testen) einen sichtbaren Error-State mit Retry-Möglichkeit statt endlosem "Lädt…".
- Keine unhandled promise rejections mehr in der Browser-Konsole bei fehlgeschlagenen Fetches in den genannten Funktionen.

---

## Arbeitspaket 2 — Bestätigungsdialoge für destruktive Aktionen (Priorität: hoch)

**Ziel:** Jede unwiderrufliche Löschaktion nutzt das bestehende `ConfirmDialog`-Pattern, konsistent mit Event-/Mitglied-Löschung.

**Betroffene Dateien:**
- `app/admin/page.tsx:475–479` — Kampagne löschen.
- `ZielgruppenDashboard.tsx:298–302` — Zielgruppe löschen.
- `CampaignBuilder.tsx:733–736` — Block entfernen (niedrigere Dringlichkeit, da Undo vorhanden, aber im selben Paket sinnvoll mitzunehmen).

**Vorgehen:**
1. Bestehendes `ConfirmDialog` (`app/admin/page.tsx:145–174`) importieren/wiederverwenden — exakt wie bei der Event-Löschung (Zeilen 1794, 1923) und Mitglied-Löschung (`ZielgruppenDashboard.tsx:220–238`) bereits gemacht.
2. Löschaktion erst nach Bestätigung im Dialog ausführen.
3. Dialogtext an bestehende Formulierungen anlehnen (z.B. "Kampagne wirklich löschen? Dies kann nicht rückgängig gemacht werden.").

**Akzeptanzkriterien:**
- Klick auf Kampagne-Löschen-Icon öffnet einen Bestätigungsdialog; erst nach "Bestätigen" wird `DELETE /api/campaigns/:id` ausgelöst.
- Klick auf Zielgruppe-Löschen öffnet denselben Dialog-Typ; erst nach Bestätigung wird gelöscht.
- Abbrechen im Dialog löst keine Löschung aus und schliesst den Dialog.
- Visuell identisch zum bestehenden `ConfirmDialog` bei Event-Löschung (kein neuer Dialog-Stil).

---

## Arbeitspaket 3 — Sprachkonsistenz (Priorität: hoch/mittel)

**Ziel:** Gäste landen auf einer Ticket-Seite/PDF in derselben Sprache wie ihre Bestätigungsmail — unabhängig davon, welche Sprache das im Einzelfall ist.

**Wichtig — Sprachkonvention (siehe Leitplanken oben):** Impact-Circle-Mitglieder werden auf Englisch angesprochen (App-Default `"en"` ist korrekt, NICHT ändern), die Öffentlichkeit wählt explizit DE/EN/FR. Dieses Paket behebt nur das **Weiterreichen** des tatsächlich gewählten `lang`-Werts durch die Kette — es ändert **nicht**, was der Default ist, wenn kein Wert vorhanden ist.

**Betroffene Dateien:**
- `lib/email.ts:111` — Ticket-Link ohne `?lang=`-Parameter.
- `app/unsubscribe/page.tsx:14–19` — hartkodiertes Englisch, unabhängig vom tatsächlichen Kampagnen-/Mitglieder-Kontext.
- `app/components/TicketPDF.tsx:209–226, 238` — hartkodiertes Englisch, unabhängig von der tatsächlich gewählten Sprache.

**Vorgehen:**
1. In `lib/email.ts:111` den `lang`-Parameter (bereits als Funktionsargument in `sendConfirmationEmail` vorhanden, Zeile 37) an die Ticket-URL anhängen: `${appUrl}/ticket/${registration.qr_token}?lang=${lang}`. **`lib/i18n.ts`s `getLang()`-Fallback auf `"en"` NICHT ändern** — das ist der korrekte Default für Impact-Circle-Mitglieder.
2. `app/unsubscribe/page.tsx` an das bestehende `lib/i18n.ts`-System anschliessen, analog zu `ticket/[token]/page.tsx` oder `success/[token]/page.tsx`. Den Unsubscribe-Link (`lib/campaign-email.ts`) um `&lang=${lang}` ergänzen, damit die tatsächliche Kampagnen-/Mitgliedersprache ankommt.
3. `TicketPDF.tsx`: Sprachparameter durchreichen (er wird bereits an anderer Stelle für Ticket/E-Mail geführt) und die hartkodierten Strings ("Date", "Location", "Guest", Programm-Platzhalter) durch eine sprachabhängige Übersetzungsfunktion ersetzen — Default-Parameter bleibt `"en"`, analog zu `sendConfirmationEmail`.

**Akzeptanzkriterien:**
- Eine Registrierung mit explizit gewähltem `lang=de` (Formular-Event) erzeugt eine Bestätigungsmail, deren Ticket-Link `?lang=de` enthält, und die Ticket-Seite zeigt deutsche Labels.
- Eine Impact-Circle-Registrierung ohne explizite Sprachwahl bleibt Englisch (Ticket-Link, Ticket-Seite, PDF) — **keine Regression auf Deutsch**.
- Das generierte PDF-Ticket zeigt Feldbezeichnungen in derselben Sprache wie die Registrierung.
- `/unsubscribe` zeigt die Sprache des jeweiligen Mitglieds/der Kampagne, nicht mehr pauschal Englisch unabhängig vom Kontext.
- Bestehende EN/FR-Kampagnen und -Ticket-Ansichten funktionieren unverändert weiter.

---

## Arbeitspaket 4 — Mobile Touch-Targets & Sichtbarkeit (Priorität: mittel)

**Ziel:** Alle interaktiven Elemente sind auf Touch-Geräten mindestens 44×44px gross und ohne Hover-Abhängigkeit erreichbar — besonders relevant, da der Scanner oft auf Tablets/Smartphones vor Ort bedient wird.

**Betroffene Dateien:**
- `app/admin/page.tsx:475–479` (Kampagnen-Löschen), `1756–1799` (Event-Listen-Aktionen), `1754` (`opacity-0 group-hover:opacity-100`).
- `ZielgruppenDashboard.tsx:18` (`btnIcon`, 36×36px).
- `app/scan/[eventId]/page.tsx:223` (PIN-Input `type="number"`).

**Vorgehen:**
1. Icon-Button-Grössen auf mind. 44×44px anheben (Padding/Grösse anpassen, bestehendes Farbschema/Icon-Set beibehalten).
2. `opacity-0 group-hover:opacity-100` in der Eventliste (`app/admin/page.tsx:1754`) so anpassen, dass die Aktionen auf Touch-Geräten permanent sichtbar sind (z.B. `opacity-100` unterhalb eines `md:`-Breakpoints, Hover-Verhalten nur ab Desktop-Breite beibehalten).
3. `app/scan/[eventId]/page.tsx:223`: `type="number"` → `type="text"` mit `inputMode="numeric"` und `pattern="[0-9]*"`; zugehörigen State von `number` auf `string` umstellen und Stellen prüfen, die den Wert weiterverarbeiten.

**Akzeptanzkriterien:**
- Alle genannten Icon-Buttons messen im gerenderten DOM mindestens 44×44px (per Browser-Devtools nachmessen).
- Auf einem simulierten mobilen Viewport (375px) sind Scanner-Link-Kopieren/Duplizieren/Archivieren/Löschen in der Eventliste ohne vorherigen "Enthüllungs-Tap" sichtbar.
- Eine PIN mit führender Null (z.B. "0142") bleibt im Scanner-Formular als "0142" erhalten, nicht als "142".
- Desktop-Hover-Verhalten bleibt für Maus-Nutzer unverändert (kein Verlust der bisherigen Optik am Desktop).

---

## Arbeitspaket 5 — Formular- & Fehler-Feedback im Admin-Login (Priorität: mittel)

**Betroffene Dateien:** `app/admin/page.tsx:815–826` (`handleLogin`), Login-Button Zeile 1124.

**Vorgehen:**
1. `loading`-State analog zu anderen Formularen der App einführen (vgl. `app/RegistrationForm.tsx:416`, `ZielgruppenDashboard.tsx:451`).
2. Button während des Requests `disabled` setzen, Lade-Indikator/-Text anzeigen.
3. Generischen Fehlerfall (Netzwerkfehler, nicht nur 401) mit sichtbarer Meldung abfangen.

**Akzeptanzkriterien:**
- Mehrfaches schnelles Klicken auf "Anmelden" löst nur einen Request aus.
- Bei einem simulierten Netzwerkfehler erscheint eine Fehlermeldung statt eines stillen Hängers.
- Verhalten/Optik konsistent mit dem Loading-Pattern anderer Formulare der App.

---

## Arbeitspaket 6 — Accessibility-Grundlagen (Priorität: mittel)

**Betroffene Dateien:**
- `app/admin/page.tsx:475–479`, `ZielgruppenDashboard.tsx:295–301`, `CampaignBuilder.tsx:733–736` — Icon-only-Buttons ohne `aria-label`.
- `app/RegistrationForm.tsx:291–306` und durchgängig im Admin-Bereich — Labels ohne `htmlFor`/`id`-Verknüpfung.

**Vorgehen:**
1. Für jeden Icon-only-Button ein `aria-label` mit der tatsächlichen Aktion ergänzen (z.B. `aria-label="Kampagne löschen"`), zusätzlich zu ggf. vorhandenem `title`.
2. Für Formularfelder `id` auf dem Input und `htmlFor` auf dem zugehörigen `<label>` ergänzen (bestehende Label-Texte/Positionierung nicht verändern, nur die semantische Verknüpfung nachrüsten).

**Akzeptanzkriterien:**
- Alle Icon-only-Buttons aus der Befundliste haben ein aussagekräftiges `aria-label`.
- Alle Formularfelder in `RegistrationForm.tsx` und den geprüften Admin-Formularen sind per `label[for]` mit ihrem Input verknüpft (per Devtools/Accessibility-Baum prüfbar).
- Keine visuelle Änderung an Layout oder Text — rein semantisch/strukturell.

---

## Arbeitspaket 7 — CSV-Import-Vorschau (Priorität: mittel)

**Betroffene Datei:** `ZielgruppenDashboard.tsx:121–162`.

**Vorgehen:**
1. Vor dem eigentlichen Upload eine einfache Vorschau anzeigen: Anzahl erkannter Zeilen, erkannte Spalten, ggf. erste 3–5 Zeilen als Tabelle.
2. Erst nach explizitem Bestätigen ("Import starten") den eigentlichen Request auslösen.
3. Bestehende Fehlerbehandlung (fehlende Spalten, `inserted: -1`) in die Vorschau vorziehen, wo möglich.

**Akzeptanzkriterien:**
- Nutzer sieht vor dem eigentlichen Import, wie viele Zeilen/Spalten erkannt wurden.
- Import wird erst nach einem zusätzlichen Bestätigungsschritt ausgeführt.
- Bestehende Fehlerfälle (fehlende Pflichtspalten) werden weiterhin korrekt gemeldet — im Idealfall bereits in der Vorschau statt erst danach.

---

## Arbeitspaket 8 — Politur (Priorität: tief, nach Freigabe der Hoch-Prio-Pakete)

Nur nach expliziter Freigabe der Pakete 1–3 in Angriff nehmen. Einzeln und unabhängig voneinander umsetzbar:

- Ticket-Token-Anzeige entfernen (`app/ticket/[token]/page.tsx:141–143`, `{token?.substring(0,8)}…`).
- Icon-Systeme im Admin vereinheitlichen (Unicode-Zeichen → bestehendes SVG-Icon-Set aus `page.tsx:26–96`) in `ZielgruppenDashboard.tsx` und `CampaignBuilder.tsx`.
- Native `confirm()`/`prompt()`/`alert()` durch bestehende Dialog-Patterns ersetzen (`scan/[eventId]/page.tsx:164`, `CampaignBuilder.tsx:100,460,463`).
- Kampagnen-Löschen-Button um Text-Label ergänzen (Konsistenz mit Event-/Mitglied-Löschung).
- Neue Kampagne standardmässig auf `"de"` statt `"en"` starten (`CampaignBuilder.tsx:838`).
- Graupalette in `email-design.ts:2` an `globals.css:4–9` angleichen.
- Horizontalen Scroll-Hinweis für die Zielgruppen-Tabelle ergänzen (`ZielgruppenDashboard.tsx:347`).
- Dynamische Seitentitel pro Route ergänzen (`metadata`/`generateMetadata` für Admin, Scanner, Ticket, Success, Unsubscribe statt globalem Titel in `app/layout.tsx:12–15`).

Für dieses Paket **keine Akzeptanzkriterien-Pflicht pro Einzelpunkt** — als Batch nach visueller Prüfung abnehmen.

---

## Vorgehen (verbindlich)

1. **Paket für Paket umsetzen**, in der Reihenfolge 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
2. **Nach jedem Paket verifizieren:** Dev-Server starten, betroffene Flows manuell durchklicken (inkl. mobiler Viewport bei Paket 4), bestehende Tests laufen lassen (`npm run test`, `npm run lint`).
3. **Ein Commit pro Paket**, mit Bezug auf das Arbeitspaket in der Commit-Message.
4. **Nach Abschluss der Hoch-Prio-Pakete (1–3) anhalten und Freigabe einholen**, bevor mit Paket 4 ff. fortgefahren wird.
5. Bei Unklarheiten zu einem Befund — nachfragen statt raten. Die Sprachkonvention (Impact Circle = Englisch, Öffentlichkeit = dreisprachig, Backend = Deutsch) ist geklärt und in den Leitplanken oben festgehalten, nicht erneut zur Diskussion stellen.
