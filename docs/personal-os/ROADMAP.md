# Personal OS: Roadmap

Stand 21.10.2026 · Befunde F1–F16 und Belege: [`ARCHITECTURE.md`](ARCHITECTURE.md) §7.
**Aktuell (21.10.):** D1 und D2 freigegeben. Slice 1 umgesetzt und verifiziert auf Branch `claude/slice-1-focus-shell`;
Production-Deploy (Merge auf `claude/personal-os-architecture-nav59w`) wartet auf Daniels Freigabe. D2 ist live in n8n.
**D3 ist auf Daniels Wunsch verschoben. Die damit offenen Risiken stehen unten unter „Bewusst offen“.**
Nächster Slice: S2.

## Leitplanken

- **North Star:** besser denken, schneller lernen, mehr behalten, wirksam umsetzen, weniger operative Arbeit.
- **Reihenfolge:** 1. was Daniel täglich nutzt (Capture → Today/Tasks), 2. Korrektheit über Systemgrenzen, 3. Kosten und
  Sicherheit, 4. neue Fähigkeiten (Gedächtnis, Lernen, Agenten). Neues erst, wenn Überlappendes zusammengelegt ist:
  das System wird nützlicher, nicht größer.
- **Slices:** vertikal, einzeln auslieferbar, mit Akzeptanzkriterien und Verifikation. Jede UI-Änderung nutzt die
  Gelegenheit, Inline-Styles der berührten Dateien in `components/ui` zu überführen (F11), ohne eigenen Umbau-Slice.
- **Belege vor Ausbau:** Voice und Chat sind gebaut, aber ungenutzt (ARCHITECTURE §8). Ausbau dort erst bei Nutzung.

Aufwand 📊: S ≤ ½ Tag · M 1–2 Tage · L > 2 Tage (mit Claude Code, inkl. Review).

## Erledigt (bis 14.10.2026)

Login, Proxy, Env-Prüfung · Today, Tasks mit Notion, optimistische Mutationen, Undo · Quick Capture (App, Siri) über n8n
mit Header-Auth · Voice-Token-Route und Spike `/voice` · PWA · Digest-Seite · iCloud-Kalender (ADR 0001) · Discover
(Intelligence + Learning) · n8n Phase 0 teilweise (Header-Auth `/add`, `/status`, Orchestrator; Notion-Integration
„Personal OS Web“; Feld `Fokus`; Agent-Retention 30 Tage). Details: Blueprint-Umsetzungsstand und Audit-Log.

## Backlog (priorisiert)

| Rang | ID | Vorhaben | Nutzen | Aufwand | Risiko | Abhängig / Freigabe | Befunde |
|---|---|---|---|---|---|---|---|
| 1 | **S1** ✅ | **Shell fokussieren:** 4 Ziele (Today, Tasks, Calendar, Read), ein Lesebereich, keine Demo-Inhalte, `check` auf frischem Clone | hoch, täglich sichtbar | S–M | niedrig, nur App, reversibel | D1 ✅ · Deploy offen | F7, F8, F9, F14, F15 |
| 2 | **S2** | **Today erzwingt Entscheidungen:** Alterssignal „seit n Tagen auf Heute“ (Regel in `rules.ts`, Schwelle 7 Tage), Review-Modus zeigt älteste zuerst, Fokus zählt nur auf Liste Heute (schützt gegen F2) | hoch (Aufgaben liegen bis 16 Tage auf Heute) | S | niedrig | – | F2 |
| 3 | **S3** ◐ | **Betrieb und Sicherheit live:** (a) ✅ `M_cockpit_status` ohne Log-Trigger, 3×/Tag, Cockpit-Ansicht gelöscht (D2, Audit-Log W42–W44); (b) ⏸ Agent-Auth an, Tool-Schlüssel als Workspace-Secret, HMAC für `/postcall`, Kosten-Zweig hinter die Prüfung, Top-3-Schritt aus dem Prompt (D3, verschoben) | mittel–hoch | S–M | mittel (Live-Systeme, Audit-Log) | D2 ✅ · D3 ⏸ | F3, F4, F5, F6 |
| 4 | S4 | **Ein Lernstrom:** Learning-Karten geprüft (`docs/learning-review.md`), Today-Karte aus der Bibliothek statt „48 Laws“, Knowledge (Notion) als dritte Quelle in Read mit Wiedervorlage | mittel–hoch (Lernen, Gedächtnis) | M | niedrig | S1; Daniels Review der 24 Karten; Design-OK | F10 |
| 5 | S5 | **Ein Task-Vertrag:** `POST /api/tasks/apply` (Header-Auth, nutzt `rules.ts`, Aktionen inkl. `fokus`, `datum`, `umbenennen`, `notiz`); `SUB_todos_apply` und `D_daily_todo_call` rufen ihn auf, ihre Code-Nodes entfallen | mittel (heute gering realisiert, da Voice/Chat ungenutzt) | M | mittel | S3 (Voice funktioniert), Nutzung von Voice/Chat; Freigabe n8n | F1, F2, F3 |
| 6 | S6 | **Weekly Review v2:** App-Nutzungssignale (Seiten, Review-Entscheidungen) als Tageszeile, Routine bewertet zusätzlich Ziele (Goals) und Umsetzung | mittel | M | niedrig | **D4** (Speicherort) | F16 |
| 7 | – | Lern-Schicht `M_improve` nur bei neuer Evidenz (Vorschlag 2 aus Weekly Review KW42) | mittel | S | niedrig | Freigabe n8n | F13 |
| 8 | – | Mail-Layout in n8n bündeln (ein Sub-Workflow für Rahmen und Palette) | niedrig | M | niedrig | nur wenn die Workflows ohnehin angefasst werden | F12 |
| – | – | Geparkt: Investments (Datenpfad offen), Passkeys, Web-Push, native Hülle, Outlook-Kalender | – | – | – | Entscheidung bei Bedarf | – |

**Bewertung der früheren UX-Richtung (Today, Tasks, Calendar, Read):** übernehmen. Belege: 6 Tabs auf dem iPhone (F9),
Investments ohne Daten (F7), Digest und Discover lesen dieselbe Quelle (F8). Read = bisheriges Discover, weil es die
Digest-Stories vollständig enthält (7 Tage statt letzter Ausgabe) und zusätzlich Learning und Feedback hat. „For you“ der
Digest-Seite entfällt; Today zeigt dieselben Signale. Was die Empfehlung ändern würde: Daniel liest die Digest-Seite
täglich als Zeitung und Discover nicht (nicht messbar, F16) → dann Read = Digest-Layout mit Discover als zweitem Modus.

## Meilensteine

| M | Inhalt | Erfolgskriterium | Status |
|---|---|---|---|
| M1 | S1 | 4 Tabs, kein Demo-Inhalt, `check` + `build` grün auf frischem Clone | ✅ verifiziert 21.10. (Branch); Deploy wartet auf Freigabe |
| M2 | S2 | Nach 2 Wochen keine offene Aufgabe länger als 7 Tage auf Heute ohne Entscheidung (Weekly Review zählt) | offen |
| M3 | S3 | n8n-Einstiegs-Ausführungen/Tag −50 % (Basis 26 am 21.10.); Agent nur mit Token; `/postcall` mit falscher Signatur ändert nichts; ein echter Voice-Call lädt die Liste | Lastteil live seit 22.10., 01:02 Berlin (Nachmessung ab 23.10.); Sicherheitsteil verschoben (D3) |
| M4 | S4 | Eine Lernquelle in der App, alle Karten geprüft, Knowledge wird gelesen | offen |
| M5 | S5 | Task-Regeln nur noch in `rules.ts`, n8n ohne eigene Notion-Patch-Logik für TODOS | offen, erst bei Voice/Chat-Nutzung |
| M6 | S6 | Weekly Review enthält App-Nutzung und Zielbezug | wartet auf D4 |

## Slice 1: Shell fokussieren (Spezifikation)

**Ziel:** Alles Tägliche über 4 Ziele erreichbar, ein Lesebereich, keine Platzhalter. Netto weniger Code.

**Umfang**
1. `package.json`: `typecheck` = `next typegen && tsc --noEmit` (F14).
2. `features/shell/Nav.tsx`: Today, Tasks, Calendar, Read; Settings nur in der Sidebar und über den Avatar.
3. Route `/read` = bisherige Discover-Seite (Page-Datei verschieben; Modulordner `features/discover` bleibt vorerst).
4. `next.config.ts`: temporäre Redirects (307) `/discover` → `/read`, `/digest` → `/read`, `/investments` → `/`.
5. Entfernen: `app/(app)/digest`, Digest-Komponenten, -Fonts und `digest/store.ts`, `latestEdition`/`forYou` samt Tests
   (sofern nur von `/digest` genutzt), `mockStories`, `TTL.digest`; `app/(app)/investments`, `features/investments`, `InvestmentsTeaser`; tote Teile aus
   F15 (`setPriority`, `move`, Tag `status`, `REVALIDATE_SECRET`, `/api/hooks/`). Erhalten bleiben
   `digest/notion-map.ts`, `digest/types.ts`, `runOf` (von Read genutzt).
6. Texte mit Investments-Bezug (Manifest, Metadata) anpassen.
7. Tests: Nav-Konfiguration (genau 4 Tab-Ziele in Reihenfolge, Settings nicht in der Tab-Bar), Redirect-Liste.
8. `ARCHITECTURE.md` (§2, §7) und diesen Status aktualisieren.

**Nicht im Umfang:** Redesign von Read, Today-Layout, Law-Karte (S4), Assistant-Karte (D3), n8n, Notion.

**Akzeptanzkriterien**

| # | Kriterium | Verifikation | Ergebnis 21.10. |
|---|---|---|---|
| A1 | iPhone (390 px): Tab-Bar zeigt genau Today · Tasks · Calendar · Read, ohne Überlauf; aktiver Tab stimmt auf `/read` | Playwright-Screenshots 390×844 hell/dunkel, Klick-Test | ✅ Playwright 390×844 hell/dunkel und 375×667: genau 4 Tabs, kein Überlauf, Klick auf Read führt nach `/read`, aktiver Tab korrekt |
| A2 | Sidebar (≥ 1024 px): Today, Tasks, Calendar, Read, Settings; Tasks-Badge unverändert | Screenshot 1280×800 | ✅ 1280×800 hell/dunkel: Today, Tasks, Calendar, Read, Settings; Badge sichtbar |
| A3 | `/read` verhält sich wie bisher `/discover`: beide Feeds, Filter, „Mehr lesen“, Leer-/Fehler-/„nicht verbunden“-Zustand, „Relevant“ im Dry-Run | bestehende Discover-Tests grün, manueller Durchlauf im Mock-Modus | ✅ Discover-Tests unverändert grün; Feed zeigt Intelligence und Learning, Umschalten funktioniert, keine Konsolenfehler |
| A4 | `/digest`, `/discover` → 307 auf `/read`; `/investments` → 307 auf `/` | `curl -sI` gegen `npm run start` | ✅ `next start` (Mock): `/digest`, `/discover` → 307 `/read` (Query bleibt erhalten), `/investments` → 307 `/` |
| A5 | Today ohne Demo-Inhalt; iPhone-Reihenfolge Orb › Top 3 › Capture unverändert | Screenshot, `grep -ri investments src` leer | ✅ kein Investments-Teaser; einziger „Demo data“-Chip ist der Mock-Kalender (nur bei `DATA_SOURCE=mock`); Reihenfolge Orb › Top 3 › Capture gemessen |
| A6 | Genau eine UI-Abfrage auf das Digest Archive (Read) | `grep` nach `recentStoriesQuery`-Aufrufen | ✅ ein Aufrufer (`features/discover/store.ts`) |
| A7 | `npm run check` grün auf frischem Clone ohne manuelles `typegen` | `rm -rf .next next-env.d.ts && npm run check` | ✅ nach `rm -rf .next next-env.d.ts`: 14 Testdateien, 137 Tests grün |
| A8 | `npm run build` grün, alle App-Routen ◐ | Build-Ausgabe | ✅ alle App-Routen ◐, `/digest`, `/discover`, `/investments` nicht mehr im Build |
| A9 | Netto weniger Zeilen in `src/` | `git diff --stat` | ✅ `src/`: +66 / −798 Zeilen; mit Tests und Konfiguration +125 / −921 |

**Unabhängiges Review (21./22.10.):** 5 Prüfer mit getrennten Blickwinkeln (Korrektheit, Next.js/Sicherheit, Doku,
n8n-D2 live, UI) plus je eine Gegenprüfung. 13 Befunde bestätigt, 0 Blocker, 2 verworfen. Behoben: Überschrift „Discover“ →
„Read“, veraltete Kommentare/Doku, D2-Zeit in Berliner Zeit, Scoring-Fenster 30 Tage, Hinweis zu veralteten
`.next/dev`-Typen. Offen: Notion-Cockpit-Text (D6). Bekannt und unverändert: Capture liegt beim ersten Laden auf dem
iPhone unter der Tab-Bar; `/read` hat auf dem iPhone keinen Avatar-Zugang zu Settings.

**Rollback:** Revert des Merge-Commits. Redirects sind temporär (307), Daten sind nicht betroffen.
**Auslieferung:** Merge auf `claude/personal-os-architecture-nav59w` = Production-Deploy → nur nach Freigabe; danach
Abnahme durch Daniel auf dem iPhone.

## Entscheidungen (Freigabe Daniel)

| ID | Frage | Entscheidung |
|---|---|---|
| D1 | Navigation weicht vom Design-Board ab: 4 Ziele, Read = Discover, Digest-Seite und Investments entfallen? | ✅ freigegeben 21.10. → Slice 1 |
| D2 | `M_cockpit_status`: Trigger „nach jedem Log-Eintrag“ entfernen, Zeitplan auf 3×/Tag (07, 13, 19 Uhr), ungeschützte HTML-Ansicht löschen? | ✅ freigegeben, live seit 22.10., 01:02 Berlin (Audit-Log W42–W44). Offen: Cockpit-Seite in Notion beschreibt noch die alten Auslöser (Änderung braucht Freigabe, D6) |
| **D3** | Voice: Sicherheit herstellen (Agent-Auth + Allowlist, Tool-Schlüssel als Workspace-Secret, HMAC `/postcall`) und den Top-3-Schritt aus dem Agent-Prompt nehmen, bis S5 steht? | ⏸ **verschoben** 21.10. auf Daniels Wunsch. Empfehlung bleibt: umsetzen. Wiedervorlage: vor der nächsten echten Voice-Nutzung, vor S5, spätestens im Weekly Review KW44 |
| D4 | Speicherort für App-Nutzungssignale (S6): Tageszeile im Notion „Agent Log“ oder Vercel Web Analytics (neuer Dienst, ADR)? | offen; Empfehlung Agent Log, entscheiden nach M2 |
| D5 | Deploy von Slice 1: Merge von `claude/slice-1-focus-shell` auf den Production-Branch? | offen |
| D6 | Notion „Agent Cockpit“: Zeile „Status-Kachel“ auf „07:05, 13:05, 19:05“ und Kante `SUB_log → Status-Kachel` im Strukturbild entfernen (nur Seiteninhalt, kein Schema)? | offen; Empfehlung ja |

## Bewusst offen (Folge von D3, Stand 21.10.)

Diese Risiken bestehen weiter, bis D3 umgesetzt ist. Nichts davon wurde verändert.

| Risiko | Wirkung | Beleg |
|---|---|---|
| Agent ohne Auth (`enable_auth: false`, Allowlist leer), Agent-ID steht im Repo | Fremde können Gespräche auf Daniels Konto starten und das Tageslimit (10) verbrauchen | F6, live geprüft 21.10. |
| `/postcall` ohne Signaturprüfung; Zweig „Call-Kosten“ läuft vor jeder Prüfung | Gefälschte POSTs können Zeilen ins Kosten-Log schreiben. Aufgaben ändern sie nicht (ohne gültigen Snapshot passiert nichts) | F6 |
| `/context`- und Mail-Link-Schlüssel im Klartext in Workflow-Nodes | Wer Lesezugriff auf die Workflows hat, kennt die Schlüssel | F6 |
| Voice aus der App lädt die Liste vermutlich nicht | Orb startet, Agent bekommt keine Aufgaben | F4 (Live-Test fehlt) |
| Top 3 per Voice wird nicht gespeichert | Agent fragt danach, Ergebnis geht verloren | F3 |
