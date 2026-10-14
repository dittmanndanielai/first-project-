# Personal OS: Vorgehen, Stand und Kalender-Vorschlag

Stand 13.10.2026

## So arbeiten wir

- **Notion** ist die einzige Datenquelle. **n8n** übernimmt die Automationen (Capture, Digest, Post-Call), **ElevenLabs** die Stimme.
- Die **App** ist Next.js auf Vercel Hobby, ohne eigene Datenbank.
- Änderungen an n8n, Notion oder ElevenLabs gibt es nur mit deiner ausdrücklichen Freigabe. Jede Änderung steht im Audit-Log `claude/daily-todo-call-setup.md` (mit Rückweg).
- Secrets (Tokens, Links, Passwörter) stehen nur in Vercel, nie im Chat oder im Repo.
- Ablauf pro Feature:
  1. Recherche, nur lesend
  2. Vorschlag mit Kosten und Aufwand
  3. Deine Freigabe
  4. Bauen mit Tests
  5. Unabhängige Prüfung
  6. Push, danach baut Vercel automatisch neu

## Stand

| Bereich | Status |
|---|---|
| Login, Today, Tasks mit echten Notion-Daten | live |
| Quick Capture (App und Siri über n8n `/add`, mit Header-Schutz) | live |
| Sprachassistent (Orb) auf dem iPhone | live |
| Digest-Seite mit Morgen- und Abendausgabe (Umschalter), Digest-Tab auf dem iPhone | gebaut. Live, sobald „🗞️ Digest Archive“ in Notion mit „Personal OS Web“ geteilt ist (••• › Connections) |
| Uhr auf „Daniel’s Headquarters“ | entfernt (Audit-Log N18) |
| Meetings | bleibt wie bisher: Teams → Notion → To-dos. Nichts gebaut |
| Mail-Check | später. Datenschutz-Konzept steht: Postfach-Filter, Regel-Filter ohne KI, keine Speicherung |
| Kalender | Vorschlag unten, Entscheidung offen |
| Investments | Platzhalter |

**Offen:**
- HMAC-Prüfung für `/postcall`
- Zugangsschutz für den ElevenLabs-Agenten (`enable_auth`, Phase 2)
- Optional: n8n-Digest speichert Leittext, Reihenfolge und Quelle (braucht Freigabe)

## Kalender-Vorschlag

**Empfehlung:** Jeder Kalender bekommt einen Freigabe-Link (ICS). Die App liest alle Links alle 5 Minuten und zeigt die Termine zusammen an.
- Das funktioniert gleich für iCloud, Outlook/Teams und Google.
- Kein neuer Dienst, kein n8n-Workflow, keine Kosten.
- Die App kann die Termine nur lesen.

| Option | Vorteile | Nachteile |
|---|---|---|
| **1. Freigabe-Link (empfohlen)** | 5 Minuten Einrichtung, kostenlos, Link jederzeit widerrufbar | Wer den Link hat, sieht Titel, Ort und Notizen dieses Kalenders. Deshalb steht er nur in Vercel |
| 2. iCloud direkt (CalDAV, app-spezifisches Passwort) | immer aktuell, später auch Termine anlegen | Das Passwort öffnet auch iCloud-Mail und Kontakte. Apple-Limits sind unklar, mehr Aufwand |
| 3. iPhone-Kurzbefehl schickt Termine | sieht alle Kalender auf dem Gerät | nur so aktuell wie die Automation, braucht Speicher, anfällig |
| 4. Outlook über n8n | geht auch, wenn die Firma Links sperrt | neuer n8n-Workflow (Freigabe), Firma muss Zugriff erlauben |

**Teams-Meetings liegen im Outlook-Kalender der Firma, nicht in iCloud.** Für das vollständige Bild braucht es zwei Links: iCloud (privat) und Outlook (Arbeit).

**Links holen (Option 1):**
- **iCloud (iPhone):** Kalender-App › Kalender › (i) neben dem Kalender › „Öffentlicher Kalender“ an › „Link teilen“. Das machst du pro Kalender.
- **Outlook:** outlook.office.com › Einstellungen › Kalender › Freigegebene Kalender › „Kalender veröffentlichen“ › „Kann alle Details anzeigen“ › ICS-Link. Fehlt die Option, sperrt die Firma das, dann bleibt Option 4.
- Die Links trägst du in Vercel als `CALENDAR_ICS_URLS` ein, durch Komma getrennt.

**Umsetzung:**
- Parser: node-ical. Ein Test mit Wiederholungen, Ausnahmen, Zeitumstellung und Outlook-Zeitzonen lief korrekt.
- Zeitfenster: heute bis +7 Tage, Europe/Berlin.
- Fällt ein Kalender aus, laufen die anderen weiter.
- Logs enthalten nie Links, Titel oder Teilnehmer.

**Aufwand:**
- etwa 6 h, bis deine echten Termine auf Today stehen
- plus etwa 5 h für die Kalender-Seite (Tag/Woche)

**Risiko:** Einen Link über etwa 1,5 MB kann Vercel nicht zwischenspeichern, und Next.js würde dann die Adresse ins Log schreiben. Die App prüft die Größe und fängt das ab.

**Entscheidung von dir:** nur iCloud oder iCloud und Outlook? Danach baue ich.
