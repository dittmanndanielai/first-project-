# ADR 0001: iCloud-Kalender über den öffentlichen ICS-Link

Stand 14.10.2026 · Status: **umgesetzt**

## Kontext

Today und die Kalenderseite sollen Daniels iCloud-Kalender zeigen, nur lesend, ohne neuen Dienst, ohne Datenbank und
ohne laufende Kosten. Outlook folgt vorerst nicht. Der iCloud-Kalender ist bereits öffentlich freigegeben.

## Entscheidung

- **Quelle:** öffentlicher iCloud-Link in `ICLOUD_CALENDAR_URL` (Vercel, nur serverseitig). Mehrere Kalender durch Komma.
  `webcal://` wird zu `https://`. Erlaubt sind nur `https` auf `*.icloud.com` (Port 443, ohne Zugangsdaten im Link).
- **Abruf** (`features/calendar/source.ts`): `fetch` ohne Next.js-Cache, Weiterleitungen manuell und nur innerhalb von
  iCloud (höchstens 3), Gesamt-Timeout 8 s, höchstens 5 MB (Header und beim Lesen, auch nach Entpacken).
  Fehler tragen nur Codes (`calendar_timeout`, `calendar_http_404` …), nie den Link.
- **Parser:** `node-ical` 0.27.3 (neue Abhängigkeit, Apache-2.0). `expandRecurringEvent()` übernimmt RRULE, EXDATE,
  RECURRENCE-ID und Zeitumstellung. Ganztägige Termine werden auf 00:00 Europe/Berlin normalisiert, unabhängig von der
  Server-Zeitzone (getestet mit UTC, Los Angeles, Tokio). Gespeichert werden nur Titel, Ort (erste Zeile), Beginn, Ende,
  ganztägig. Beschreibung, Teilnehmer und Notizen nie.
- **Zeitraum:** 14 Tage zurück bis 90 Tage voraus, höchstens 3000 Termine.
- **Cache:** `unstable_cache` (persistenter Next.js-Data-Cache, Tag `calendar`) mit dem **geparsten Ergebnis**, Schlüssel =
  Tag + 5-Minuten-Fenster. Damit höchstens ein iCloud-Abruf pro 5 Minuten, nur wenn die App genutzt wird, und nach einer
  Pause nie stundenalte Termine (kein Stale-while-revalidate über das Fenster hinaus).
- **Manueller Refresh:** Server Action `refreshCalendar` → `updateTag("calendar")`, der nächste Aufruf lädt sofort neu.
- **Ausfälle:** Today lädt die Kalender-Karte in einer eigenen Suspense-Grenze; Aufgaben erscheinen sofort. Nach einem
  Fehlschlag wird 60 s lang nicht erneut versucht (pro Instanz), der Refresh hebt das auf. Fällt einer von mehreren
  Kalendern aus, erscheinen die übrigen.

## Warum nicht der `fetch`-Cache wie bei Notion?

iCloud liefert die komplette Historie. Über 2 MB speichert Next.js einen `fetch`-Eintrag nicht und schreibt dabei die
**volle URL** ins Log (`Failed to set Next.js data cache for <url> …`, geprüft in
`next/dist/server/lib/incremental-cache`). Das wäre der geheime Link in den Vercel-Logs. Außerdem müsste ohne Cache des
Ergebnisses bei jedem Aufruf neu geparst werden. `unstable_cache` speichert dasselbe persistent wie der `fetch`-Cache,
läuft laut Next-16-Doku mit Cache Components weiter und loggt nur den Funktionsnamen. `use cache` scheidet aus (auf
Vercel nur pro Instanz), `use cache: remote` ebenfalls (zusätzlicher Cache-Handler, Kosten offen).

## Alternativen

| Option | Warum nicht |
|---|---|
| CalDAV mit app-spezifischem Passwort | Passwort öffnet auch Mail und Kontakte, mehr Aufwand, Schreibzugriff nicht gebraucht |
| n8n-Workflow, der den Kalender nach Notion spiegelt | regelmäßige Ausführungen, neue Fehlerquelle, verzögert |
| Kalender-Bibliothek für die Ansicht (FullCalendar o. ä.) | Tag/Woche als Liste reicht und nutzt das bestehende Design-System |

## Folgen

- Keine neuen Kosten, kein Hintergrundjob, keine n8n-Ausführungen.
- iCloud veröffentlicht Änderungen am öffentlichen Feed selbst verzögert (Minuten). Die App zeigt „Updated HH:MM“.
- Wer den Link kennt, liest den Kalender. Bei Verdacht: in der Kalender-App „Öffentlicher Kalender“ aus- und wieder
  einschalten (neuer Link) und `ICLOUD_CALENDAR_URL` in Vercel ersetzen.
- `node-ical` schreibt bei kaputten Einträgen Warnungen mit UID oder TZID ins Log, nie Titel oder den Link.

## Später: Sprachassistent

`voiceAgenda()` in `features/calendar/rules.ts` liefert dieselben Daten kompakt und sprechbar
(`{ date, events: [{ time, title, location }] }`). Ein Endpunkt dafür ist bewusst **nicht** gebaut. Wenn der
ElevenLabs-Agent den Kalender abrufen soll: eigene Route mit eigener Auth (z. B. Header-Secret wie bei n8n), die
`getCalendar()` + `voiceAgenda()` nutzt, plus Tool im Agenten (braucht Freigabe, Audit-Log).
