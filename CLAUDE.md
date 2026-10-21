# Personal OS: Regeln für Claude Code

@AGENTS.md

Persönliches AI Operating System für genau einen Nutzer (Daniel).

## Kontext (nur lesen, was die Aufgabe braucht)
- Ist-Architektur, Datenquellen, Befunde F1–F16: `docs/personal-os/ARCHITECTURE.md`
- Prioritäten, nächster Slice, offene Freigaben: `docs/personal-os/ROADMAP.md`
- Vertrag Notion ↔ n8n ↔ App: `docs/notion-contract.md` · Entscheidungen: `docs/decisions/`
- Betrieb n8n/ElevenLabs und Audit-Log: `claude/daily-todo-call-setup.md`
- Planungsstand 12.10. mit Begründungen (historisch): `docs/architecture/personal-os-blueprint.md`

Stack: Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind v4 + Design-Tokens in
`src/app/globals.css` · Vercel. Daten: Notion = Source of Truth, n8n = Automationen (Capture, Digest, Post-Call),
ElevenLabs = Voice. Keine eigene Datenbank.

## Befehle
- `npm run dev` (Mock-Daten, lokales Passwort `dev`)
- `npm run check` = `next typegen` + typecheck + lint + Unit-Tests. Vor jedem Commit grün. Meldet typecheck fehlende
  Seiten unter `.next/dev/types` (veraltete Dev-Typen nach Branch-Wechsel): `rm -rf .next/dev` und erneut prüfen.
- `npm run build` prüft zusätzlich die Cache-Components-Regeln (Request-Daten nur innerhalb von Suspense).
- `npm run hash-password`, `npm run capture-token <gerät>` erzeugen Werte für Vercel.

## Arbeitsweise
- Explore → Specify → Implement → Verify, in vertikalen Slices aus `ROADMAP.md`. Kein Umbau ohne Slice.
- Vor dem Editieren `git status`; fremde Änderungen nicht überschreiben.
- „Funktioniert“ nur mit Beleg: Test, Build oder Screenshot (Playwright, Mock-Modus, 390 px und 1280 px, hell/dunkel).
- Nach jedem Slice: Status in `ROADMAP.md`, geänderte Fakten in `ARCHITECTURE.md`. Nichts zwischen Dateien doppeln.
- `claude/personal-os-architecture-nav59w` ist der Vercel-Production-Branch: Push oder Merge dorthin = Deploy.

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
  Ausnahme Kalender: `unstable_cache` mit dem geparsten Ergebnis, ICS-Abruf `no-store` (ADR `docs/decisions/0001`).
- Pro Request höchstens eine Notion-Abfrage pro Quelle (`listTasks` ist mit React `cache()` dedupliziert).
  Today, Tasks, Badge und Kopfzeile leiten alles aus derselben Liste ab (`deriveToday`).
- Geschäftsregeln rein und getestet in `features/tasks/rules.ts`; dieselben Regeln nutzt die optimistische UI.
- **Task-Semantik existiert dreimal** (F1): `rules.ts`, n8n `SUB_todos_apply`, n8n `D_daily_todo_call`
  („Notion-Aktionen planen“). Wer Regeln ändert, prüft alle drei und hält Abweichungen in `notion-contract.md` fest.
- Datum und Uhrzeit nur über `lib/time.ts` (Europe/Berlin). Vercel läuft in UTC.
- Kein LLM-SDK, keine Datenbank, kein neuer Dienst ohne kurze ADR in `docs/decisions/`.
- Secrets nur über `lib/env.ts` (server-only, Zod-geprüft). Nie `NEXT_PUBLIC_` für Tokens oder Keys.
- Logs über `lib/log.ts`: Event, IDs, Dauer. Nie Task-Titel, Transkripte, Tokens, Request-Bodies.

## Tabu ohne ausdrückliche Freigabe von Daniel
- n8n-Workflows, Notion-Schemas/Datenbanken, ElevenLabs-Agent/Tools ändern oder löschen.
  MCP-Zugriffe darauf sind standardmäßig nur lesend. Freigegebene Änderungen im Audit-Log
  `claude/daily-todo-call-setup.md` eintragen.
- Production-Deploy, Produktionsdaten ändern, Credentials/Secrets ändern, externe Kommunikation (Mails, Nachrichten).
- Schlüssel und geheime Webhook-Pfade, die in n8n-Nodes oder Tool-Configs im Klartext stehen, nie in Repo, Doku
  oder Chat übernehmen.

## Design
- Verbindliche Referenz: `design/personal-os.html` (7 Boards). Nicht ungefragt umgestalten.
- UI-Texte englisch wie im Design; Notion-Werte deutsch nur in `notion-map.ts`. Ausnahme: Discover-Inhalte deutsch
  (`docs/discover.md`).
- iPhone (≤ 760 px): Floating Tab Bar, Reihenfolge Orb › Top 3 › Capture (CSS-Klassen `m-*`).
- Neue oder angefasste UI nutzt Bausteine aus `src/components/ui/` statt Inline-Styles (F11).

## Benennung
Dateien kebab-case bzw. Komponenten PascalCase.tsx, Actions als Verben (`completeTask`), Domäne englisch im Code.

## Tests
Unit (Vitest, `tests/unit`): Regeln, Notion-Mapping mit echten API-Formen, Auth, Zeitzone.
Neue Regel oder neues Mapping = neuer Test.
