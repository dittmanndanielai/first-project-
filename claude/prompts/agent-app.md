# Prompt: Agent-App (für eine neue Claude-Code-Session)

Repo: dittmanndanielai/first-project-. Den Block unten komplett in den neuen Chat kopieren.

---

Baue mir eine kleine Web-App als Oberfläche für meinen persönlichen Agenten. Arbeite im Repo `dittmanndanielai/first-project-` im neuen Ordner `agent-app/`. Lies zuerst `claude/daily-todo-call-setup.md`. Dort ist mein bestehendes System dokumentiert: n8n-Workflows, Notion-Datenbank TODOS, Agent Log, Morning/Evening Brief, Daily To-do Call mit ElevenLabs, Personal Agent (Chat), Status-Kachel.

## Ziel
Ein Fenster für alles: Status auf einen Blick, Chat mit dem Agenten, To-dos per Chat ändern, Anruf beim ElevenLabs-Agenten mit einem Tipp. Kein Telegram, kein Notion als Oberfläche.

## Funktionen (MVP)
1. **Statuszeile oben:** Gesamtstatus („Alles läuft“ / „1 Sache braucht dich“), letzte Läufe von Morning Brief, Daily Call, Evening Brief. Details nur bei Problemen, aufklappbar. Daten aus dem Agent Log.
2. **Chat:** Ich schreibe frei („verschieb Steuer auf Freitag“, „was steht heute an?“). Der Agent antwortet mit Text oder mit **Aktionskarten**: Vorschlag (alt → neu) mit „Bestätigen“ / „Ändern“. Einfache Aktionen (erledigt abhaken) sofort ausführen, mit „Rückgängig“. Alle Änderungen an To-dos gehen über n8n in die Notion-DB TODOS. Die bestehende Aktionslogik des Daily To-do Calls wiederverwenden (`daily_call.aktionen`).
3. **Briefs als Nachricht:** Morning und Evening Brief erscheinen als Nachricht im Chat (kurz, mit „Mehr“) plus Push-Benachrichtigung (Web Push, iOS ab 16.4 bei Installation auf dem Home-Bildschirm). Die Mail bleibt vorerst parallel.
4. **Anruf-Knopf:** Startet das Gespräch mit meinem ElevenLabs-Agenten direkt in der App (ElevenLabs Conversational AI Web SDK). Das Telefonat bleibt mein Hauptweg, um To-dos zu besprechen; das Ergebnis erscheint danach als Zusammenfassung im Chat.
5. **Heute-Liste:** kompakte Liste der offenen To-dos von heute, antippen → Aktionen (erledigt, verschieben, Priorität).

## Design
Hell, Apple-Stil, sehr modern: Hintergrund #f5f5f7, weiße Karten mit großen Radien, SF-Schrift (system-ui), viel Weißraum, eine Akzentfarbe, dezente Animationen, keine Emojis, kein Sci-Fi-Look. Mobile first (iPhone), auf dem Mac als schmales Fenster ebenfalls gut. Installierbar als PWA (Manifest, Icon, Vollbild ohne Browserleiste).

## Technik (Vorschlag, begründet abweichen erlaubt)
- Frontend: statische PWA (Vite + React oder schlankes Vanilla-JS), kostenloses Hosting (Cloudflare Pages oder GitHub Pages).
- Backend: ausschließlich n8n-Webhooks als API (JSON, kein HTML aus n8n – HTML-Antworten von n8n werden in Notion/iOS blockiert, siehe W35). Endpunkte z. B. `GET /status`, `GET /todos/today`, `POST /chat`, `POST /action`, `GET /messages?since=`.
- Notion-Token und LLM-Schlüssel bleiben in n8n, nie im Browser.
- Zugriffsschutz: nur ich. Einfaches geheimes Token, einmal auf dem Gerät gespeichert, von n8n geprüft; CORS nur für die App-Domain.
- Chat-Verlauf und Briefs in einer Notion-DB oder n8n-Data-Table speichern, damit sie auf allen Geräten gleich sind.

## Vorgehen
1. Zuerst ein **klickbarer Prototyp mit Beispieldaten** (alle Ansichten, inkl. Aktionskarten und Anruf-Knopf). Zeig ihn mir als Screenshot/Artifact, bevor irgendetwas an n8n angebunden wird.
2. Danach API-Vertrag (Endpunkte, JSON-Formate) als Datei in `agent-app/API.md`.
3. Dann die n8n-Workflows bauen und testen, jeweils dokumentiert in `claude/daily-todo-call-setup.md` (gleiches Tabellenformat).
4. Laufende Kosten (LLM pro Nachricht, Hosting, n8n-Ausführungen) am Ende kurz abschätzen.

Frag nur nach, wenn eine Entscheidung das Ergebnis wesentlich ändert. Antworte auf Deutsch.
