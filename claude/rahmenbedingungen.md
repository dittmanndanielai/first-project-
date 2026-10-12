# Rahmenbedingungen Agent-App

Stand: 12.10.2026, 17:30 · **Freigabe: offen.** Die App (`claude/prompts/agent-app.md`) wird erst gebaut, wenn Daniel die Punkte unter „Offen“ beantwortet hat.

Legende: **gemessen** = aus n8n/ElevenLabs/Notion gelesen · **Preis lt. Quelle** = öffentliche Preisangabe, nicht auf der Anbieterseite geprüft · **Schätzung** = Annahmen stehen dabei.

## 1. Laufende Kosten heute (ohne App)

### Nach Kostenart

| Klasse | Posten | Was es bezahlt | Monat (€) | Basis |
|---|---|---|---|---|
| **Fix** | n8n Cloud (`danieldtmn.app.n8n.cloud`) | alle Workflows, Webhooks, Zeitpläne | **20–24** (Starter) · 50–60 (Pro) | Preis lt. Quelle; Plan unbekannt → O-K1 |
| **Fix** | ElevenLabs-Abo | Sprachagent Daily Call | **5–6** (Starter) | Preis lt. Quelle; Plan unbekannt → O-K2 |
| Variabel | ElevenLabs Minuten über Kontingent + LLM `gpt-5.4-mini` | Gespräche > Inklusivminuten | 0–7 | Schätzung: 1 Call/Tag à 3 Min. = 90 Min./Monat |
| Variabel | OpenAI `gpt-5.1` (Orchestrator) | Chat „Personal Agent“ | 2–12 | Schätzung: 0,01–0,02 € je Nachricht (Agent-Schleife mit 2–3 Modellaufrufen), 5–20 Nachrichten/Tag |
| Variabel | OpenAI `gpt-5-nano` / `gpt-5-mini` (SUB_llm) | Briefs, Daily-Call-Auswertung, Capture, Lern-Schicht | 1–3 | Schätzung: Brief ca. 0,02 € je Lauf × 60, Rest Centbeträge |
| Optional, aus | Twilio (Nummer + Minuten) | echter Telefonanruf statt Browser | 0 (sonst 3–4) | O3 offen, nicht eingerichtet |
| Optional, aus | OpenAI `whisper-1` | Transkription | 0 | in Agent Config hinterlegt, kein Workflow nutzt es (Annahme) |
| Indirekt | Claude-Abo | Bauen, Wartung, Routine „PA Meta-Review“ | nicht zugerechnet | läuft ohnehin |
| Indirekt | Notion | Gedächtnis, Config, Log | 0 | API kostenlos; Plan ist unabhängig vom Agenten |
| Kostenlos | Gmail, GitHub, githack (Weltuhr), iOS-Kurzbefehle | Mails, Repo, Widget, Auslöser | 0 | – |

**Summe Laufzeit: ca. 30–50 €/Monat, davon rund 70 % Fixkosten (n8n + ElevenLabs).**
Die alte Schätzung in `daily-todo-call-setup.md` (16–17 €) enthielt Twilio, das nicht läuft, und ließ n8n weg. Sie ist damit überholt.

### Nach Funktion (variabler Anteil)

| Funktion | Treiber | Monat (€) |
|---|---|---|
| Chat (Personal Agent) | Nachrichten × `gpt-5.1` | 2–12, **größter variabler Posten**, wächst mit der App |
| Daily To-do Call | Minuten ElevenLabs + 1 LLM-Auswertung je Call | 0–7 |
| Morning/Evening Brief | 2 Läufe/Tag, Scoring + Redaktion | 1–2 |
| Hintergrund (Lern-Schicht, Hygiene, Status-Kachel) | 1 LLM-Lauf/Nacht, sonst nur n8n-Ausführungen | < 1 |
| Capture (Siri „Aufgabe notieren“) | 1 `gpt-5-nano`-Aufruf je Diktat | < 0,5 |

### Gemessener Verbrauch (Bauphase, nicht repräsentativ)

| Quelle | Zeitraum | Wert |
|---|---|---|
| n8n | 11.10. 20:38 – 12.10. 17:05 | ca. 250 Ausführungen gesamt, davon ca. 50 Top-Level (der Rest Sub-Workflows). Viele Tests. |
| ElevenLabs | 11.–12.10. | 7 Gespräche, zusammen 6 Min., alle über Browser/SDK (`react_sdk`) |
| Modelle (Notion Agent Config) | aktuell | `model_fast` gpt-5-nano · `model_reasoning` gpt-5-mini · `model_orchestrator` gpt-5.1 · ElevenLabs-LLM gpt-5.4-mini, TTS `eleven_v4_turbo`, max. 6 Min./Call, 10 Calls/Tag |

### n8n-Ausführungsbudget (Schätzung Regelbetrieb)

n8n Cloud zählt nur Top-Level-Ausführungen; Sub-Workflows und manuelle Tests zählen nicht (n8n-Doku). Starter enthält 2.500/Monat.

| Workflow | pro Tag | pro Monat |
|---|---|---|
| `M_cockpit_status` stündlich 06–23 Uhr | 18 | 540 |
| `D_daily_todo_call` (Status-Check, Kontext, Post-Call) | 3–5 | 90–150 |
| `B_news_digest` | 2 | 60 |
| `PA_orchestrator` (Chat) | 0–20 | 0–600 |
| Capture, Feedback-Klicks, Hygiene, Lern-Schicht | 4–6 | 120–180 |
| **Summe** | | **ca. 800–1.500** (32–60 % von Starter) |

Größter Einzelposten ist die stündliche Status-Kachel, nicht die KI.

## 2. Rahmenbedingungen für die App (Vorschlag)

| # | Bedingung | Warum |
|---|---|---|
| R1 | **Monatsbudget gesamt** festlegen (Vorschlag 50 €), Warnung ab 80 % | Kosten bleiben sichtbar, bevor die App mehr Nutzung erzeugt |
| R2 | **Kein Polling.** Daten nur beim Öffnen, beim Zurückholen in den Vordergrund und per Ziehen-zum-Aktualisieren laden. Briefs kommen per Push. | Ein 30-Sekunden-Polling wären ca. 2.900 Ausführungen am Tag und sprengt jeden n8n-Plan |
| R3 | **Ein Sammel-Endpunkt** `GET /bootstrap` (Status + Heute-Liste + neue Nachrichten) statt vier Aufrufe | 1 statt 4 Ausführungen je App-Öffnung; 20 Öffnungen/Tag = 600/Monat |
| R4 | **Chat-Modell bewusst wählen.** Start mit `gpt-5.1`; wenn der Chat Hauptweg wird, Test mit `gpt-5-mini` (ca. 5× günstiger) über `model_orchestrator`, ohne Deploy umstellbar | Chat ist der einzige Posten, der mit der App stark wächst |
| R5 | **Anruf in der App kostet vermutlich vollen Minutenpreis.** Die Talk-to-Seite von ElevenLabs läuft mit Test-Rabatt (halber Preis, siehe Setup-Doku), ein eigener SDK-Aufruf wahrscheinlich nicht. Vor dem Bau prüfen. | Daily Call könnte sich im Preis verdoppeln |
| R6 | **Hosting kostenlos** (Cloudflare Pages oder GitHub Pages), keine neuen Abos ohne Freigabe | Fixkosten sind schon der Hauptanteil |
| R7 | **Ausgabenlimits bei den Anbietern setzen:** OpenAI-Projektlimit pro Monat, ElevenLabs-Tageslimit bleibt 10 Calls | harte Obergrenze statt nur Beobachtung |
| R8 | **Web Push technisch vorab klären.** Versand braucht VAPID-Signatur und Verschlüsselung; ob das im n8n-Cloud-Code-Node ohne npm-Pakete geht, ist offen. Ausweichweg: kleiner Cloudflare Worker (Gratis-Kontingent). | sonst blockiert Funktion 3 erst mitten im Bau |
| R9 | Zugriff nur für Daniel: geheimes Token im Header, CORS nur App-Domain, Schlüssel bleiben in n8n | unverändert aus dem App-Prompt |
| R10 | **Verbrauch von Anfang an mitloggen** (siehe 3.), auch wenn das Fenster erst später kommt | sonst fehlt beim Einschalten die Historie |

## 3. Fenster „Verbrauch“ (für später)

Eigene Ansicht in der App, erreichbar über die Statuszeile („Kosten diesen Monat: 23 € von 50 €“). Im klickbaren Prototyp mit Beispieldaten enthalten, angebunden erst nach dem MVP.

**Inhalt**
1. Kopf: Kosten Monat bis heute, Budget, Prognose Monatsende, Ampel (grün < 80 %, gelb ab 80 %, rot ab 100 %).
2. Aufteilung Fix / Variabel als ein Balken.
3. Nach Anbieter: n8n (Ausführungen x von 2.500, Planpreis), ElevenLabs (Minuten, Inklusiv vs. extra), OpenAI (€ nach Modell).
4. Nach Funktion: Chat, Daily Call, Briefs, Hintergrund, Capture; je Funktion € und Anzahl Läufe.
5. Verlauf: Tageskosten der letzten 30 Tage.
6. Teuerste Läufe (Top 5) mit Link zur n8n-Ausführung.

**Datenquelle (Vorschlag)**
- `SUB_llm` und `PA_orchestrator` schreiben `tokens_in`, `tokens_out`, `modell` und berechnete `kosten_eur` in die Agent-Log-Zeile (die OpenAI-Antwort enthält die Token-Zahlen).
- `D_daily_todo_call` (Post-Call) schreibt `minuten` aus `call_duration_secs` von ElevenLabs.
- Preise als Tabelle in Notion (neue Spalten in Agent Config oder eigene DB „Preise“), damit Preisänderungen ohne Deploy greifen.
- Nächtlicher Workflow `M_usage_daily` verdichtet Agent Log + n8n-Ausführungszahl in die Data Table `pa_usage` (Tag × Anbieter × Funktion) und rechnet Fixkosten anteilig ein.
- Endpunkt `GET /usage?monat=2026-10` liefert die Ansicht als JSON.
- Abgleich einmal im Monat mit den echten Rechnungen (Feld „Ist laut Rechnung“), weil Schätzpreise abweichen können.

## 4. Offen (vor dem App-Bau)

| # | Frage | Wer |
|---|---|---|
| O-K1 | Welcher n8n-Plan läuft (Starter/Pro, monatlich/jährlich)? Zu sehen unter n8n → Admin Panel → Plan. | Daniel |
| O-K2 | Welcher ElevenLabs-Plan, wie viele Inklusivminuten? ElevenLabs → Subscription. | Daniel |
| O-K3 | Was hat OpenAI im Oktober bisher gekostet? platform.openai.com → Usage. Damit wird die Schätzung zur Messung. | Daniel |
| O-K4 | Monatsbudget für den ganzen Agenten (Vorschlag 50 €)? | Daniel |
| O-K5 | Soll der Chat in der App der Hauptweg werden? Dann `gpt-5-mini` testen (R4). | Daniel |
| O-K6 | R5 prüfen: Preis pro Minute bei SDK-Gesprächen vs. Talk-to-Seite (ElevenLabs-Abrechnung eines Test-Calls ansehen). | ich, mit Daniel |
| O-K7 | R10 schon jetzt umsetzen (Token-Logging in SUB_llm/Orchestrator, ca. 30 Min.)? Ändert n8n, deshalb erst nach Freigabe. | Daniel entscheidet |

## Quellen (Preise, nicht auf Anbieterseiten geprüft)
- n8n-Pläne: [jetadmin.io](https://www.jetadmin.io/blog/n8n-pricing/), [costbench.com](https://costbench.com/software/ai-automation/n8n)
- n8n zählt Sub-Workflows nicht: [docs.n8n.io – Understand executions](https://docs.n8n.io/build/understand-workflows/understand-executions)
- ElevenLabs-Pläne und Agentenminuten: [happyrobot.ai](https://www.happyrobot.ai/hub/elevenlabs-pricing), [getmacha.com](https://www.getmacha.com/blog/elevenlabs-agents-pricing-explained), [cloudzero.com](https://www.cloudzero.com/blog/elevenlabs-pricing/)
- OpenAI `gpt-5.1` 1,25 $ / 10 $ je 1 Mio. Tokens: [anotherwrapper.com](https://anotherwrapper.com/llm-pricing/gpt-5.1-2025-11-13). `gpt-5-mini` (0,25 $ / 2 $) und `gpt-5-nano` (0,05 $ / 0,40 $) sind Annahmen aus dem Wissensstand, bitte gegen OpenAI-Usage prüfen.
- Umrechnung 1 $ ≈ 0,90 € (Annahme).
