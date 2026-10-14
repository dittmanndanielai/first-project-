# Notion-Vertrag: TODOS

Gemeinsame Sprache von Personal OS (`src/features/tasks/notion-map.ts`) und den n8n-Workflows
(`SUB_todos`, `SUB_todos_apply`, `D_todo_capture`, `D_daily_todo_call`, `C_todos_hygiene`).
Wer hier etwas umbenennt, muss beide Seiten anpassen. Schemaänderungen nur mit Freigabe.

Data Source: `b8065b38-5580-43fc-b022-e8708fc1b680` · API-Version `2025-09-03`

| Property | Typ | Werte | Personal OS | n8n |
|---|---|---|---|---|
| `Titel` | title | – | liest | liest, legt an, benennt um |
| `Liste` | select | `Heute`, `Diese Woche`, `Broader Timeframe` | liest, setzt (verschieben, Top 3) | liest, setzt |
| `Prio` | select | `Hoch`, `Mittel`, `Niedrig` | liest, setzt | liest, setzt |
| `Status` | select | `offen`, `erledigt` (leer = offen) | liest, setzt | liest, setzt, Hygiene füllt leer → offen |
| `Fokus` | checkbox | Top 3 für heute, max. 3 offene | liest, setzt | ignoriert (neu seit 12.10.2026) |
| `Datum` | date | nur harte Deadlines | liest | setzt (Capture) |
| `Erledigt am` | date | Tag des Erledigens (Europe/Berlin) | setzt beim Erledigen, leert beim Öffnen | setzt |
| `reschedule_count` | number | +1 nur beim Verschieben in eine spätere Liste | liest, setzt | liest, setzt |
| `Ziel` | relation → Goals | – | liest (Titel als Chip) | – |
| `Notizen` | rich_text | – | – | setzt (Capture, Post-Call) |
| `Person` | relation | – | – | – |
| `created_by` | select | `user`, `agent` | liest | setzt |

## Regeln, die beide Seiten einhalten
- Absolute Werte schreiben (Status setzen, nicht umschalten), damit Wiederholungen harmlos sind.
- Löschen = `in_trash: true` (Papierkorb, wiederherstellbar), nie endgültig.
- Neue Aufgaben legt nur n8n an (`D_todo_capture`, Post-Call). Personal OS ruft dafür `/add` auf.
- Offene Liste = `Status` ≠ `erledigt` oder leer. Personal OS lädt zusätzlich heute Erledigte für den Fortschritt.

# Notion-Vertrag: Digest Archive (nur lesend)

Schreiber ist ausschließlich n8n `B_news_digest` (täglich 08:00 und 17:00, Europe/Berlin, je Lauf bis zu 8 Stories).
Personal OS liest nur (`src/features/digest/notion-map.ts`). Voraussetzung: Datenbank mit der Connection
„Personal OS Web“ geteilt.

Data Source: `42a6a120-423e-4375-8a43-f7d5002a2d11` · API-Version `2025-09-03`

| Property | Typ | Werte | Personal OS |
|---|---|---|---|
| `Titel` | title | deutsche Überschrift (LLM) | Überschrift |
| `Kernaussage` | rich_text | ein Satz | Teaser |
| `Datum` | date | Tag der Ausgabe | jüngster Tag = aktuelle Ausgabe |
| `Themenfeld` | multi_select | `Geopolitik`, `Wirtschaft`, `KI`, `VC` | erstes Feld bestimmt die Rubrik: Wirtschaft/VC → Markets & Money, Rest → Daily Brief |
| `Source Count` | number | Quellen im Cluster | Reihenfolge (mehr Quellen zuerst) |
| `Canonical URL` | url | Original-Artikel, bei Economist oft leer | Link (nur http/https) |
| `Story ID` | rich_text | Hash der URL bzw. `economist:<datum>:<n>` | Duplikate je Ausgabe entfernen |
| (Seite) `created_time` | – | Schreibzeit | Morgen- (vor 14 Uhr) vs. Abendausgabe |
| `Kernpunkte` | rich_text | Stichpunkte, getrennt durch `\n` (seit 14.10.2026) | Discover: 3 auf der Karte, alle in „Mehr lesen“ |
| `Warum relevant` | rich_text | Einordnung (seit 14.10.2026) | Discover: Analyse; leer = Thin-Card |
| `Was folgen könnte` | rich_text | Ausblick (seit 14.10.2026) | Discover: Einschätzung |
| `Chance` | rich_text | mögliche Chance (seit 14.10.2026) | Discover: „Chance für dich“ |
| `Impact` | select | `Hoch`, `Mittel`, `Niedrig` (seit 14.10.2026) | Discover: Reihenfolge im Tag, Punkt bei Hoch |
| `Kennzahl` | rich_text | „Wert – Label“ (seit 14.10.2026) | Discover: große Zahl, getrennt am ersten „ – “ |
| `Quelle` | rich_text | Feedname, z. B. „The Decoder“ (seit 14.10.2026) | Discover: Quellenname; Feedback übernimmt ihn unverändert |

Ältere Zeilen haben die Felder ab `Kernpunkte` leer oder gar nicht; die App behandelt das wie leer.
Nicht gespeichert und daher nicht in der App: Rang/Score, Rubrik, Lead-Text, „Dein Move heute“.
Änderungen daran betreffen `B_news_digest` und brauchen Freigabe.

# Notion-Vertrag: Digest Feedback (Discover schreibt nur `klick`)

Data Source: `dc9965a6-28f0-4380-85ea-4d95894363ec` · Leser: `B_news_digest` (Scoring: Bonus für Quellen und
Themenfelder mit `klick` der letzten 30 Tage) · Schreiber: Klicks in der Digest-Mail und Discover „Relevant“
(`src/features/discover/notion-map.ts`). Voraussetzung: Datenbank mit „Personal OS Web“ geteilt.

| Property | Typ | Discover schreibt |
|---|---|---|
| `Name` | title | `Relevant: <Quelle oder Titel>` |
| `Typ` | select | immer `klick` (vorhandene Option, keine neue) |
| `Story ID` | rich_text | Story ID aus dem Archiv |
| `Quelle` | rich_text | `Quelle` der Story, leer bleibt leer (kein Hostname) |
| `Themenfeld` | rich_text | erstes Themenfeld der Story (`KI`, `Wirtschaft`, `Geopolitik`, `VC`) |
| `Datum` | date | heute (Europe/Berlin) |

Pro Story und Tag höchstens ein `klick`: vor dem Schreiben prüft die App `Story ID` + `Datum` + `Typ = klick`, auch
Einträge aus der Mail zählen. Geschrieben wird nur mit `DISCOVER_FEEDBACK_WRITE=true`, sonst Dry-Run.
