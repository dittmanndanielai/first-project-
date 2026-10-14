# Discover V1

Stand 14.10.2026 · Branch `feature/discover` · Route `/discover` (Sidebar und Tab Bar)

Vertikaler Card-Feed mit zwei Modi: **Intelligence** (Stories der letzten 7 Tage aus dem Notion „Digest Archive“) und
**Learning** (24 kuratierte Karten im Repo). Kein Social Feed: festes Ende, keine Likes, kein Nachladen.

## Repo-Analyse: was wiederverwendet wird

| Baustein | Wiederverwendet | Erweitert |
|---|---|---|
| Notion-Client `lib/notion.ts` (fetch, Retries, fetch-Cache mit Tags) | unverändert | – |
| Archiv-Adapter `features/digest/notion-map.ts` | `storyFromNotion`, `recentStoriesQuery`, `safeUrl` | 7 neue Properties (Kernpunkte … Quelle), `storyByIdQuery`, `TOPIC_TO_NOTION`; fehlende Properties → leere Werte, nie ein Fehler |
| Auth `requireSession()` / `hasSession()`, Proxy | Page in `<Suspense>`, Route Handler mit `hasSession` | – |
| Zeit `lib/time.ts` (Europe/Berlin) | `isoDate`, `minutesOfDay`, `minusDays` | `germanDayLabel` („Di. 13. Okt.“) |
| Design-Tokens `globals.css`, Toast, Icons, Nav | alle Repo-Tokens (`--card`, `--text`, `--accent` …) | Themenfarben `--tone-*` und `--economist` (fehlten), Icons Kompass und Daumen |
| Env `lib/env.ts` (Zod, server-only) | – | `NOTION_FEEDBACK_DS_ID`, `DISCOVER_FEEDBACK_WRITE` |

## Wo Discover liegt

- `src/features/discover/`: `types.ts` (gemeinsames Modell), `intelligence.ts` (Adapter, Sortierung), `learning.ts`
  (Zod-Schema, Reihenfolge), `learning-content.ts` (Liste der JSON-Dateien), `rules.ts`, `store.ts` (Notion, Cache),
  `feedback.ts` + `notion-map.ts` (Digest Feedback), `components/` (Client-UI).
- `content/learning/*.json`: 24 Karten, eine Datei pro Karte. Prüfliste: `docs/learning-review.md`.
- `src/app/(app)/discover/page.tsx`, `src/app/api/discover/feedback/route.ts`.
- Tests: `tests/unit/discover.test.ts`, `learning.test.ts`, `discover-feedback.test.ts`.

## Entscheidungen

1. **Cache = fetch-Cache** wie die Digest-Seite (Tag `digest`, 30 min, persistiert auf Vercel), kein `unstable_cache`.
   Kein Endpunkt zur manuellen Invalidierung. Der ganze Feed kommt in einer Antwort; Swipen lädt nichts (gemessen: 0 Requests).
2. **Learning-Validierung** per Zod beim Laden des Moduls: ein ungültiger Eintrag bricht `next build` und die Tests ab.
3. **Reihenfolge Intelligence:** Tag absteigend; im Tag volle Karten vor Thin-Cards, Impact Hoch → Niedrig, dann der jüngere
   Lauf, sonst Mail-Reihenfolge. Pro Story ID eine Karte (vollständigere, sonst jüngere).
4. **Modell-Anpassungen an Repo-Konventionen:** `impact` als `high | medium | low` (Notion-Werte deutsch nur in
   `notion-map.ts`); zusätzlich `categories: string[]`, damit der Filter alle Themenfelder einer Story trifft.
5. **UI-Texte deutsch** wie in der Discover-Vorgabe („Mehr lesen“, „Du bist auf dem Stand.“). Das weicht bewusst von
   „UI-Texte englisch“ in `CLAUDE.md` ab, weil die Inhalte deutsch sind; Kategorien und Feed-Namen bleiben englisch.
6. **Wheel-Handler auf dem Mac:** `scroll-snap-stop: always` allein verhinderte in Chromium keine Mehrfachsprünge
   (gemessen: ein Ruck mit 2400 px sprang 4 Karten). Eine Wheel-/Trackpad-Geste blättert jetzt genau eine Karte per
   nativem `scrollTo`; Momentum wird geschluckt. Touch bleibt vollständig natives Scroll-Snap.
7. **Einblenden** startet, sobald 15 % der nächsten Karte sichtbar sind (statt erst beim Einrasten), damit beim Wischen nie
   eine leere Karte zu sehen ist. Nur `opacity`/`transform`; `prefers-reduced-motion` schaltet alles ab.
8. **„Mehr lesen“** je nach Breite: Sheet von unten (≤ 760 px), Drawer rechts (761–1099 px, modal), Panel rechts neben der
   Karte (≥ 1100 px, nicht modal, folgt beim Blättern).
9. **Keine Virtualisierung.** Gemessen mit 124 Karten bei 4× CPU-Drosselung: nach Memoisierung der Karten 60 fps beim
   Scrollen, schlechtester Frame 23–31 ms; bereit nach ~2 s (42 Karten: ~0,9 s).
10. **Feedback** nur über `POST /api/discover/feedback`, lokal Dry-Run. Details und Ablauf: Kommentar in `feedback.ts`.

## Bewusst nicht gebaut

Save (bräuchte eine Schemaänderung), „Not interested“ (wirkt nicht im Scoring), manuelle Cache-Invalidierung,
Virtualisierung, iPad-Optimierung.
