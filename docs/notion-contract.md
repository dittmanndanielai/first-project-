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
