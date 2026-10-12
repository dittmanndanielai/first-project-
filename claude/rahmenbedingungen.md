# Rahmenbedingungen Agent-App

Stand: 12.10.2026, 18:20 · **Freigabe App: offen.** Die App (`claude/prompts/agent-app.md`) wird erst gebaut, wenn Daniel die Punkte unter „Offen“ beantwortet hat. Das Kosten-Tracking läuft bereits (Abschnitt 3).

Legende: **gemessen** = aus n8n/ElevenLabs/Notion gelesen · **bestätigt** = von Daniel · **Preis lt. Quelle** = öffentliche Preisangabe, nicht auf der Anbieterseite geprüft · **Schätzung** = Annahmen stehen dabei.

## 1. Laufende Kosten heute (ohne App)

### Nach Kostenart

| Klasse | Posten | Was es bezahlt | Monat (€) | Basis |
|---|---|---|---|---|
| **Fix** | n8n Cloud Starter (`danieldtmn.app.n8n.cloud`) | alle Workflows, Webhooks, Zeitpläne; 2.500 Ausführungen | **24** (20 bei Jahreszahlung) | Plan bestätigt, Preis lt. Quelle |
| **Fix** | ElevenLabs Creator, für 3 Monate (Okt.–Dez.) | Sprachagent Daily Call, ca. 100.000 Credits/Monat | **ca. 20** (22 $) | Plan bestätigt, Preis und Kontingent lt. Quelle |
| Variabel | ElevenLabs über Kontingent | nur wenn > 100.000 Credits | 0 | gemessen: 63-s-Call = 223 Credits (mit Test-Rabatt) → 90 Min./Monat ≈ 19.000 Credits = 19 % |
| Variabel | OpenAI `gpt-5.1` (Orchestrator) | Chat „Personal Agent“ | 1–6 | gemessen/geschätzt: ca. 0,006–0,01 € je Nachricht, 5–20 Nachrichten/Tag |
| Variabel | OpenAI `gpt-5-nano` / `gpt-5-mini` / `gpt-4.1-mini` (SUB_llm) | Briefs, Daily-Call-Auswertung, Capture, Lern-Schicht | 1–3 | Schätzung; ab jetzt im Kosten-Log gemessen |
| Optional, aus | Twilio (Nummer + Minuten) | echter Telefonanruf statt Browser | 0 (sonst 3–4) | O3 offen, nicht eingerichtet |
| Optional, aus | OpenAI `whisper-1` | Transkription | 0 | in Agent Config hinterlegt, kein Workflow nutzt es |
| Indirekt | Claude-Abo | Bauen, Wartung, Routine „PA Meta-Review“ | nicht zugerechnet | läuft ohnehin |
| Indirekt | Notion | Gedächtnis, Config, Log, Kosten-Tracking | 0 | API kostenlos; Plan ist unabhängig vom Agenten |
| Kostenlos | Gmail, GitHub, githack (Weltuhr), iOS-Kurzbefehle | Mails, Repo, Widget, Auslöser | 0 | – |

**Summe Laufzeit Okt.–Dez.: ca. 46–53 €/Monat, davon rund 85 % Fixkosten (44 €).**
Creator ist für den heutigen Verbrauch zu groß (19 % Auslastung). Ab Januar reicht voraussichtlich Starter (ca. 5 €, 30.000 Credits ≈ 140 Min. mit Test-Rabatt) → **ca. 30–37 €/Monat**. Entscheidung vor Ende Dezember anhand der Kosten-Monate (O-K10).
Die alte Schätzung in `daily-todo-call-setup.md` (16–17 €) enthielt Twilio, das nicht läuft, und ließ n8n weg. Sie ist überholt.

### Nach Funktion (variabler Anteil)

| Funktion | Treiber | Monat (€) |
|---|---|---|
| Chat (Personal Agent) | Nachrichten × `gpt-5.1` | 1–6, **größter variabler Posten**, wächst mit der App |
| Morning/Evening Brief | 2 Läufe/Tag, Scoring + Redaktion | 1–2 |
| Daily To-do Call | Credits im Abo + 1 LLM-Auswertung je Call | < 0,5 |
| Hintergrund (Lern-Schicht, Hygiene, Status-Kachel) | 1 LLM-Lauf/Nacht, sonst nur n8n-Ausführungen | < 1 |
| Capture (Siri „Aufgabe notieren“) | 1 `gpt-4.1-mini`-Aufruf je Diktat, gemessen ca. 0,0002 € | < 0,1 |

### Gemessener Verbrauch

| Quelle | Zeitraum | Wert |
|---|---|---|
| n8n | 11.10. 20:38 – 12.10. 17:05 | ca. 250 Ausführungen gesamt, davon ca. 50 Top-Level (der Rest Sub-Workflows). Viele Tests. |
| ElevenLabs | 11.–12.10. | 7 Gespräche, zusammen 6 Min., alle über die Talk-to-Seite (`react_sdk`, Test-Rabatt aktiv). Beispiel Exec 943: 63 s = 223 Credits (Stimme 188 + LLM 35), Gegenwert 0,04 $ |
| OpenAI Chat | Exec 1005 | „Was steht heute an?“: 2 Modellrunden, n8n zählt ca. 2.600 Prompt-Tokens → ca. 0,006–0,01 € |
| Modelle (Notion Agent Config) | aktuell | `model_fast` gpt-5-nano · `model_reasoning` gpt-5-mini · `model_orchestrator` gpt-5.1 · Capture fest gpt-4.1-mini · ElevenLabs-LLM gpt-5.4-mini, TTS `eleven_v4_turbo`, max. 6 Min./Call, 10 Calls/Tag |

### n8n-Ausführungsbudget (Schätzung Regelbetrieb)

n8n Cloud zählt nur Top-Level-Ausführungen; Sub-Workflows und manuelle Tests zählen nicht (n8n-Doku). Starter enthält 2.500/Monat.

| Workflow | pro Tag | pro Monat |
|---|---|---|
| `M_cockpit_status` stündlich 06–23 Uhr | 18 | 540 |
| `D_daily_todo_call` (Status-Check, Kontext, Post-Call) | 3–5 | 90–150 |
| `B_news_digest` | 2 | 60 |
| `PA_orchestrator` (Chat) | 0–20 | 0–600 |
| Capture, Feedback-Klicks, Hygiene, Lern-Schicht | 4–6 | 120–180 |
| Kosten-Tracking (SUB_cost) | 0 | 0 (läuft nur als Sub-Workflow) |
| **Summe** | | **ca. 800–1.500** (32–60 % von Starter) |

Größter Einzelposten ist die stündliche Status-Kachel, nicht die KI. Sie wird ohnehin nach jedem Agent-Log-Eintrag neu berechnet; der Stundenplan fängt nur ausgefallene Läufe ab. Drei feste Prüfzeiten (z. B. 08:30, 12:30, 18:30) würden ca. 450 Ausführungen im Monat sparen (O-K8).

## 2. Rahmenbedingungen für die App (Vorschlag)

| # | Bedingung | Warum |
|---|---|---|
| R1 | **Monatsbudget gesamt**: vorläufig 60 € in Kosten-Monate eingetragen (Fixkosten 44 € + Puffer), Warnung ab 80 % der Prognose | Kosten bleiben sichtbar, bevor die App mehr Nutzung erzeugt |
| R2 | **Kein Polling.** Daten nur beim Öffnen, beim Zurückholen in den Vordergrund und per Ziehen-zum-Aktualisieren laden. Briefs kommen per Push. | Ein 30-Sekunden-Polling wären ca. 2.900 Ausführungen am Tag und sprengt jeden n8n-Plan |
| R3 | **Ein Sammel-Endpunkt** `GET /bootstrap` (Status + Heute-Liste + neue Nachrichten + Kosten-Kopfzeile) statt mehrerer Aufrufe | 1 statt 4–5 Ausführungen je App-Öffnung; 20 Öffnungen/Tag = 600/Monat |
| R4 | **Chat-Modell bewusst wählen.** Start mit `gpt-5.1`; wenn der Chat Hauptweg wird, Test mit `gpt-5-mini` (ca. 5× günstiger) über `model_orchestrator`, ohne Deploy umstellbar | Chat ist der einzige Posten, der mit der App stark wächst |
| R5 | **Anruf in der App: Test-Rabatt prüfen.** Gespräche über die Talk-to-Seite laufen mit `dev_discount` (gemessen). Ob ein eigener SDK-Aufruf den Rabatt auch bekommt, zeigt das Kosten-Log automatisch (Notiz „Test-Rabatt: ja/nein“). Ohne Rabatt ca. doppelte Credits pro Minute, im Creator-Kontingent trotzdem unkritisch. | Credits-Verbrauch kann sich verdoppeln |
| R6 | **Hosting kostenlos** (Cloudflare Pages oder GitHub Pages), keine neuen Abos ohne Freigabe | Fixkosten sind schon der Hauptanteil |
| R7 | **Ausgabenlimits bei den Anbietern setzen:** OpenAI-Projektlimit pro Monat, ElevenLabs-Tageslimit bleibt 10 Calls | harte Obergrenze statt nur Beobachtung |
| R8 | **Web Push technisch vorab klären.** Versand braucht VAPID-Signatur und Verschlüsselung; ob das im n8n-Cloud-Code-Node ohne npm-Pakete geht, ist offen. Ausweichweg: kleiner Cloudflare Worker (Gratis-Kontingent). | sonst blockiert Funktion 3 erst mitten im Bau |
| R9 | Zugriff nur für Daniel: geheimes Token im Header, CORS nur App-Domain, Schlüssel bleiben in n8n | unverändert aus dem App-Prompt |
| R10 | **Kosten werden mitgeschrieben, nicht abgefragt** (Abschnitt 3). Kein Zeitplan für Kostenauswertung; neue Workflows mit LLM-Aufruf laufen über SUB_llm oder melden ihre Kosten an SUB_cost. | 0 zusätzliche Ausführungen |

## 3. Kosten-Tracking (läuft seit 12.10.2026)

**Prinzip:** Jeder Lauf meldet seine Kosten in dem Moment, in dem er ohnehin läuft. Notion rechnet Summen, Prognose und Ampel live. Es gibt keinen stündlichen oder nächtlichen Auswerte-Lauf und damit **keine zusätzliche n8n-Ausführung** (SUB_cost läuft nur als Sub-Workflow, asynchron).

**Im Headquarters:** Kachel „Agent-Status“, Abschnitt „KOSTEN <MONAT>“ (bisher/Budget, Prognose, Credits, n8n-Ausführungen) mit Link zur Detailseite. Wird mit der Kachel aktualisiert, ohne eigenen Lauf.

**Detailseite:** Notion → Agent Cockpit → „Kosten & Verbrauch“
1. **Monatsübersicht** (Kosten-Monate): Status-Ampel, Gesamt bisher, Prognose Monatsende, Budget, Fix, Variabel, Credits % vom Kontingent, Call-Minuten, n8n-Ausführungen ≈ (von 2.500), Feld „Ist laut Rechnung“ für den Monatsabgleich.
2. **Variable Kosten nach Funktion** (Donut, 30 Tage).
3. **Variable Kosten pro Tag** (Säulen nach Funktion, 30 Tage).
4. **Teuerste Läufe** (30 Tage) mit Link zur n8n-Ausführung.

**Datenfluss**

| Quelle | Was gemeldet wird | Genauigkeit |
|---|---|---|
| `SUB_llm` (Briefs, Daily-Auswertung, Capture, Lern-Schicht) | Tokens ein/aus/Cache, Websuchen, Modell aus der OpenAI-Antwort | exakt |
| `PA_orchestrator` (Chat) | Tokens aus Textlänge je Modellrunde | Schätzung (Spalte „Geschätzt“), eher zu hoch |
| `D_daily_todo_call` Post-Call | Minuten, Credits, Test-Rabatt, Gegenwert aus dem ElevenLabs-Webhook | exakt |
| `SUB_log` | jede Agent-Log-Zeile hängt am Monat → Zählung der n8n-Läufe | Näherung: Läufe mit Log + 18 Statusläufe/Tag; Status-Checks des Kurzbefehls fehlen |

- Preise: Notion Agent Config, Spalte `preise_json` (USD je 1 Mio. Tokens, Modell per Präfix). Unbekanntes Modell → Standardpreis gpt-5.1 und Hinweis in der Notiz.
- Fixkosten, Budget und Credits-Kontingent stehen je Monatszeile und werden von Hand gepflegt. Zeilen Okt.–Dez. 2026 sind angelegt; fehlt ein Monat, legt SUB_cost ihn mit Standardwerten an (44 € / 60 € / 100.000).
- ElevenLabs im Abo: `Kosten €` = 0, Verbrauch in Credits. Der Gegenwert steht nur in der Notiz.

**Später in der App:** Ansicht „Verbrauch“ liest dieselben Notion-Daten über den Sammel-Endpunkt (R3) oder `GET /usage?monat=2026-10`. Keine eigene Datenhaltung nötig.

## 4. Offen

| # | Frage | Wer |
|---|---|---|
| O-K1 | Erledigt 12.10.: n8n Starter. Offen nur: monatlich oder jährlich (24 € vs. 20 €)? | Daniel |
| O-K2 | Erledigt 12.10.: ElevenLabs Creator für 3 Monate. Kontingent 100.000 Credits lt. Quelle, bitte in ElevenLabs → Subscription bestätigen. | Daniel |
| O-K3 | OpenAI-Kosten Oktober bisher (platform.openai.com → Usage) einmal gegen das Kosten-Log halten. | Daniel |
| O-K4 | Monatsbudget bestätigen (vorläufig 60 €). | Daniel |
| O-K5 | Soll der Chat in der App der Hauptweg werden? Dann `gpt-5-mini` testen (R4). | Daniel |
| O-K8 | Status-Kachel nur noch zu 3 festen Zeiten statt stündlich prüfen (spart ca. 450 Ausführungen/Monat)? | Daniel entscheidet, ich setze um |
| O-K9 | Zwei simulierte Testzeilen im Kosten-Log („TEST (simuliert, löschen)“) zählen nicht und können gelöscht werden; die Notion-API des Connectors kann keine Seiten löschen. | Daniel |
| O-K10 | Ende Dezember: ElevenLabs auf Starter zurück, falls Credits % dauerhaft < 30 %. | Daniel |

## Quellen (Preise, nicht auf Anbieterseiten geprüft)
- n8n-Pläne: [jetadmin.io](https://www.jetadmin.io/blog/n8n-pricing/), [costbench.com](https://costbench.com/software/ai-automation/n8n)
- n8n zählt Sub-Workflows nicht: [docs.n8n.io – Understand executions](https://docs.n8n.io/build/understand-workflows/understand-executions)
- ElevenLabs-Pläne und Agentenminuten: [happyrobot.ai](https://www.happyrobot.ai/hub/elevenlabs-pricing), [getmacha.com](https://www.getmacha.com/blog/elevenlabs-agents-pricing-explained), [cloudzero.com](https://www.cloudzero.com/blog/elevenlabs-pricing/)
- OpenAI `gpt-5.1` 1,25 $ / 10 $ je 1 Mio. Tokens: [anotherwrapper.com](https://anotherwrapper.com/llm-pricing/gpt-5.1-2025-11-13). Übrige Modellpreise in `preise_json` sind Annahmen aus dem Wissensstand; Abgleich über O-K3.
- Umrechnung 1 $ ≈ 0,90 € (Annahme, in `preise_json` änderbar).
