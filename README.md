# Personal OS

Persönliches AI Operating System für iPhone, iPad und Mac: Today-Dashboard, Aufgaben aus Notion,
Quick Capture über n8n, ElevenLabs-Sprachassistent als Orb. Next.js 16 auf Vercel, keine eigene Datenbank.

- Architektur und Roadmap: [`docs/architecture/personal-os-blueprint.md`](docs/architecture/personal-os-blueprint.md)
- Regeln für die Weiterentwicklung: [`CLAUDE.md`](CLAUDE.md)
- Notion-Vertrag mit n8n: [`docs/notion-contract.md`](docs/notion-contract.md)
- Betrieb n8n/ElevenLabs: [`claude/daily-todo-call-setup.md`](claude/daily-todo-call-setup.md)

## Lokal starten

```sh
npm install
npm run dev        # http://localhost:3000, Demo-Daten, Passwort "dev"
npm run check      # Typen, Lint, Unit-Tests
```

## Deployment (Vercel)

1. Repository in Vercel importieren (Framework: Next.js, keine Build-Anpassung nötig).
   Production Branch: `claude/personal-os-architecture-nav59w` (GitHub-Default-Branch oder Vercel › Settings › Environments).
2. Environment Variables aus `.env.example` setzen. Production: `DATA_SOURCE=notion` und alle Secrets.
   Preview: nur `DATA_SOURCE=mock`, `SESSION_SECRET`, `AUTH_PASSWORD`.
   Ohne Terminal: `SESSION_SECRET` und `AUTH_PASSWORD` je als starkes Passwort aus der Passwörter-App.
3. Nach dem ersten Deploy: Safari öffnen, anmelden, Teilen › „Zum Home-Bildschirm“ (iPhone/iPad)
   bzw. Ablage › „Zum Dock hinzufügen“ (Mac).
4. Voice-Test auf dem iPhone in der installierten App: Tab „Today“ › Talk (Seite `/voice`).
