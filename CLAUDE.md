# Personal OS: Regeln für Claude Code

@AGENTS.md

Persönliches AI Operating System für genau einen Nutzer (Daniel). Architektur und Roadmap:
`docs/architecture/personal-os-blueprint.md`. Betrieb von n8n/ElevenLabs: `claude/daily-todo-call-setup.md`.

Stack: Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind v4 + Design-Tokens in
`src/app/globals.css` · Vercel. Daten: Notion = Source of Truth, n8n = Automationen (Capture, Post-Call),
ElevenLabs = Voice. Keine eigene Datenbank.

## Befehle
- `npm run dev` (Mock-Daten, lokales Passwort `dev`)
- `npm run check` = typecheck + lint + Unit-Tests. Vor jedem Commit grün.
- `npm run build` prüft zusätzlich die Cache-Components-Regeln (Request-Daten nur innerhalb von Suspense).
- `npm run hash-password`, `npm run capture-token <gerät>` erzeugen Werte für Vercel.

## Architektur
- Code nach Modul: `src/features/<modul>/` (types, store, rules, actions, components). Gemeinsames nur in
  `src/lib/` und `src/components/ui/`.
- Notion-Property-Namen NUR in `features/*/notion-map.ts`. Vertrag mit n8n: `docs/notion-contract.md`.
- UI-Mutationen = Server Actions über `authedAction` (`src/lib/action.ts`): Session + Zod + einheitliche Fehler.
  Ausnahmen nur Login und Logout. Route Handlers nur für externe Aufrufer (Siri, n8n, Voice-Token).
- Jede Page ruft zuerst `requireSession()` innerhalb einer `<Suspense>`-Grenze auf, erst danach Daten.
  So landen keine privaten Daten im prerenderten statischen Shell.
- Server-Cache = `fetch`-Cache mit Tags (`lib/notion.ts`, persistiert auf Vercel). `use cache` hält auf
  Serverless nur pro Instanz und ist dafür nicht gedacht. Tags nur aus `lib/cache-tags.ts`.
  Nach Mutation: `updateTag()` in Server Actions, `revalidateTag(tag, { expire: 0 })` in Route Handlers.
- Pro Request höchstens eine Notion-Abfrage pro Quelle (`listTasks` ist mit React `cache()` dedupliziert).
  Today, Tasks, Badge und Kopfzeile leiten alles aus derselben Liste ab (`deriveToday`).
- Geschäftsregeln rein und getestet in `features/tasks/rules.ts`; dieselben Regeln nutzt die optimistische UI.
- Datum und Uhrzeit nur über `lib/time.ts` (Europe/Berlin). Vercel läuft in UTC.
- Kein LLM-SDK, keine Datenbank, kein neuer Dienst ohne kurze ADR in `docs/decisions/`.
- Secrets nur über `lib/env.ts` (server-only, Zod-geprüft). Nie `NEXT_PUBLIC_` für Tokens oder Keys.
- Logs über `lib/log.ts`: Event, IDs, Dauer. Nie Task-Titel, Transkripte, Tokens, Request-Bodies.

## Tabu ohne ausdrückliche Freigabe von Daniel
- n8n-Workflows, Notion-Schemas/Datenbanken, ElevenLabs-Agent/Tools ändern oder löschen.
  MCP-Zugriffe darauf sind standardmäßig nur lesend. Freigegebene Änderungen im Audit-Log
  `claude/daily-todo-call-setup.md` eintragen.

## Design
- Verbindliche Referenz: `design/personal-os.html` (7 Boards). Nicht ungefragt umgestalten.
- UI-Texte englisch wie im Design; Notion-Werte deutsch nur in `notion-map.ts`.
- iPhone (≤ 760 px): Floating Tab Bar, Reihenfolge Orb › Top 3 › Capture (CSS-Klassen `m-*`).

## Benennung
Dateien kebab-case bzw. Komponenten PascalCase.tsx, Actions als Verben (`completeTask`), Domäne englisch im Code.

## Tests
Unit (Vitest, `tests/unit`): Regeln, Notion-Mapping mit echten API-Formen, Auth, Zeitzone.
Neue Regel oder neues Mapping = neuer Test.
