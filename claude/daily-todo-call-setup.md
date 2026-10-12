# Daily To-do Call – Setup & Audit-Log

Stand: 11.10.2026, 23:50 · Session 3 (Agent Log, Prompts in Notion, Config-Cache, debugbarer Zustand, Orchestrator, Meta-Routine). Session 2 (Struktur-Review) und Session 1 (Erstaufbau) sind unten als Historie erhalten.

## Architektur (aktuell)

```
Notion = Gedächtnis und einzige Wahrheit
   TODOS · Agent Config (Modelle, Flags) · Prompts (alle System-Prompts, versioniert, aktiv/inaktiv)
   Agent Log (eine Zeile pro Lauf, mit Execution-Link) · Meta-Reviews (Wochen-Reviews)

n8n = Ausführung (Ordner „Personal AI Agent“)
   Gemeinsame Bausteine
   ├─ SUB_config       Agent Config + Prompts aus Notion lesen, 5-Minuten-Cache
   ├─ SUB_llm          einziger LLM-Zugang (OpenAI); Prompt per prompt_key aus Notion, {{vars}} werden ersetzt
   ├─ SUB_todos        nummerierte To-do-Liste aus Notion (serverseitig gefiltert)
   ├─ SUB_todos_apply  Aktionen (erledigt, verschieben, neu, umbenennen, notiz, prio, datum, loeschen) auf Notion anwenden
   ├─ SUB_state        Zustand in Data Table pa_state (Tagesstatus, Pause, Call-Snapshots), in n8n einsehbar
   ├─ SUB_log          Zeile ins Agent Log schreiben (fällt nie hart aus)
   └─ ERR_notify       bei jedem Workflow-Fehler: Fehlermail + Agent-Log-Zeile

   D_daily_todo_call   iPhone-Kurzbefehl (/status) · ElevenLabs-Agent (/context, /postcall) · 12-Uhr-Fallback (aus)
   PA_orchestrator     Runtime-Orchestrator: n8n Chat (Chat Hub, n8n-Login) + Webhook → AI Agent (Modell aus Agent Config)
                       Tools: todos_lesen · todos_aendern · notion_suchen · notion_lesen → Antwort → Agent Log
   B_news_digest       täglicher Intelligence-Digest, Prompts aus Notion → Agent Log
   C_todos_hygiene     täglich 06:40: fehlenden Status „offen“ und created_by „user“ nachtragen

Claude = Bauen und Meta-Schicht
   dieser Chat                 Builder und Wartung über MCP (n8n, Notion, ElevenLabs)
   Routine „PA Meta-Review“    sonntags 17:47: Agent Log, To-dos, Prompts der Woche lesen → Review-Seite in Notion (schlägt vor, ändert nichts)
```

Rollenverteilung: Notion hält Wissen und Konfiguration, n8n führt aus und loggt, Claude baut und bewertet. Kein Workflow enthält mehr einen Prompt im Code; alle Prompts liegen in Notion „Prompts“ und werden über SUB_config gecacht geladen.

## IDs und Orte

| System | Objekt | ID / Ort |
|---|---|---|
| n8n | `D_daily_todo_call` | `7RHkHLnrUrcwCndH`, aktiv |
| n8n | `PA_orchestrator` (neu) | `nt84eGHOArJrKzuI`, veröffentlicht. Chat: n8n → Chat → Agent „Personal Agent“. Webhook POST `…/webhook/pa-chat-…` mit Body `{ "text": "…", "sessionId": "…" }`; Pfad enthält geheimen Teil, steht im Webhook-Node |
| n8n | `SUB_todos` | `0JbiuOaUkaiGZZAp` |
| n8n | `SUB_todos_apply` (neu) | `qLrDyIKIYwiwPwWY`, Input `{ aktionen }` |
| n8n | `SUB_llm` | `SEPkupoYoj8yqV7p`, jetzt mit `prompt_key` + `vars` und Config aus SUB_config |
| n8n | `SUB_config` (neu) | `qEclJGTzNoSm39MW`, Output `{ cache, config, prompts, prompt_meta }`, `force_refresh: true` leert den Cache |
| n8n | `SUB_state` (neu) | `yz0jUkeTRNDp8jaQ`, Data Table `pa_state` (`BMm8ByfZHW5pgpbp`), Keys `day:YYYY-MM-DD`, `pause_until`, `snapshot:<conversation_id>` |
| n8n | `SUB_log` (neu) | `zWvKLTujqGLN0yGG` |
| n8n | `ERR_notify` | `o6l8HeuZhUNK64IT` |
| n8n | `B_news_digest` | `WFN6F556tlRi5PSe` |
| n8n | `C_todos_hygiene` (neu) | `iagFXTrUDqPQIiOH`, täglich 06:40 |
| n8n | Webhook-Basis Daily | `https://danieldtmn.app.n8n.cloud/webhook/todo-…/` – vollständige URL im Webhook-Node, enthält geheimen Teil, nicht teilen |
| ElevenLabs | Agent „To-do Agent (Daily)“ | `agent_2601m4p82ey6ew8bnejvezdmrt9x` |
| ElevenLabs | Tool `todos_abrufen` | `tool_5101m4p81tejfw0vk83g53zsr748` |
| Notion | TODOS | Data Source `b8065b38-5580-43fc-b022-e8708fc1b680` (Daniel’s Headquarters / AI Operating System) |
| Notion | Agent Config | Data Source `d62ed4d7-a48d-4a49-9725-808dc6716138`, Zeile „Global“ (`model_fast`, `model_reasoning`, `model_orchestrator`) |
| Notion | Prompts (neu) | Data Source `c768fdf4-97f9-4465-a7ed-83b049d75207`. Keys: `daily_call.aktionen`, `digest.scoring`, `digest.redaktion`, `orchestrator.system`, `elevenlabs.todo_agent.system` (Kopie, ElevenLabs liest nicht aus Notion) |
| Notion | Agent Log (neu) | Data Source `b3790be9-17d2-4368-8a57-09d171cd1622` |
| Notion | Meta-Reviews (neu) | Seite `3f682151-c6cc-8182-a24e-c5f7f1f2b114` unter AI Operating System |
| n8n | `SUB_cost` (neu) | `yeA3NEIjiWKnz0HU`, Input `{ funktion, anbieter, modell, tokens_in, tokens_cached, tokens_out, websuchen, minuten, credits, geschaetzt, titel, notiz, execution_url }` |
| Notion | Kosten & Verbrauch (neu) | Seite `3f782151-c6cc-8145-b0b0-db5b28567d64` unter Agent Cockpit |
| Notion | Kosten-Monate (neu) | Data Source `c665ca43-f757-43b9-b744-8c68eb48704c`, Titel `JJJJ-MM` |
| Notion | Kosten-Log (neu) | Data Source `b8603a24-799a-415a-aeed-ae254a8dc15c` |
| Claude | Routine „PA Meta-Review (wöchentlich)“ | `trig_01WukBfP8fHRGqVuKVaWsK4E`, `CRON_TZ=Europe/Berlin 47 17 * * 0`, erster Lauf So 18.10.2026, neue Session je Lauf, Push-Benachrichtigung |

Hinweis: Die IDs aus Session 1 (`agent_9401…`, `tool_6401…`) tauchen im Connector nicht mehr auf. Der Connector sieht genau einen Agenten mit den neuen IDs, angelegt 11.10. 21:47 Uhr. Das ist sehr wahrscheinlich der Umzug nach „My Workspace“ aus einem anderen Chat. Bitte einmal in der ElevenLabs-Oberfläche bestätigen (siehe Offen O6).

## Änderung 12.10.2026: Bestätigungsmail

| # | Aktion | Objekt | Details |
|---|---|---|---|
| W25 | Workflow umgebaut | `D_daily_todo_call` | Mail nur noch bei mindestens einer Notion-Änderung oder Fehler (neuer If-Node „Mail nötig?“); Calls ohne Änderung landen nur im Agent Log. Anlass: zwei Mails am 12.10. durch zwei Calls (einer abgebrochen), beide mit 0 Änderungen. |
| W26 | Mail-Layout neu | `D_daily_todo_call` | Gleiches Design-System wie der Intelligence Digest (Hintergrund #f5f5f7, weiße Karten, Eyebrows, SF-Typo, keine Emojis). Aufbau: Kopf mit Anzahl Änderungen, Kennzahlen (erledigt / geändert / heute offen), Karte „Änderungen“ mit farbigem Typ-Label je Aktion, Karte „Heute offen“ nummeriert mit Tags Hoch/Neu, „Bitte kurz prüfen“, „Fehler“. Betreff `Daily · 12. Okt. · 3 Änderungen`, Vorschautext im Postfach. Tests 950 und 957: 0 Änderungen → keine Mail, Log geschrieben. |
| W27 | Mail-Links | `D_daily_todo_call` | Button „To-do-Liste öffnen“ im Kopf und Footer-Link auf die TODOS-Datenbank (`notion.so/0cc26d3d…`, öffnet auf dem iPhone die Notion-App). Jede Zeile unter „Heute offen“ verlinkt direkt auf die Notion-Seite des To-dos (neue To-dos ohne ID → Liste). Test 964: IDs aus dem Snapshot kommen an. |
| N11 | Seite neu | Notion „Agent Cockpit“ | Unter AI Operating System (`3f782151-c6cc-817d-9609-d335e877ba49`). Statusmeldung, Schnellzugriff, Status-Tabelle aller Bausteine (Stand 12.10. 13:40), Strukturbild (Mermaid), Bedienfeld „Du willst … / So geht’s“, Live-Ansichten aus dem Agent Log: „Letzte Läufe“, „Probleme“ (Status ≠ ok), Diagramm „Läufe pro Workflow“. |
| N12 | Seite verschoben | Agent Cockpit | Jetzt direkt unter Daniel’s Headquarters, ganz oben; darüber die Kachel „Agent-Status“ (wird automatisch geschrieben). Im Cockpit zusätzlich „Agent-Hinweise“ (Fehler/unklar der letzten 24 h) über den Live-Ansichten. |
| N13 | Prompt neu | Prompts `meta.verbesserung` v2 | Anweisung der Lern-Schicht: genau eine Regel pro Nacht, ≤ 250 Zeichen, passend zum Zweck des Ziel-Prompts, keine Dubletten, „keine“ wenn kein Anlass. |
| N14 | Prompt geändert | Prompts `daily_call.aktionen` v3 | Abschnitt „Gelernte Regeln“. Regel 1 (aus Lernlauf 973, von Hand vervollständigt, weil auf 300 Zeichen abgeschnitten): knappe Antworten ohne Nummer auf das zuletzt genannte To-do beziehen, sonst unklar. |
| W28 | Workflow neu | `M_cockpit_status` (`ls4XJgwky7oVn8NJ`) | Liest Agent Log (3 Tage), schreibt Kachel „Agent-Status“ (Morning Brief, Evening Brief, Daily To-do Call, Personal Agent (Chat), Lern-Schicht, zuletzt gelernt; gelb bei ausgefallenem Brief, rot bei Fehlern) und „Agent-Hinweise“. Auslöser: stündlich 06–23 Uhr und nach jedem Agent-Log-Eintrag. Kein Error-Workflow (sonst Schleife über ERR_notify → SUB_log). Tests 971, 977. |
| W29 | Workflow neu | `M_improve` (`8C6LbFSzTLngoHES`) | Lern-Schicht, nächtlich 03:15: Agent Log 7 Tage + Prompts → SUB_llm (`meta.verbesserung`) → genau eine Regel neu/ersetzen/entfernen in `daily_call.aktionen` oder `orchestrator.system`. Leitplanken: Grundtext unverändert, max. 12 Regeln, Sicherheit „niedrig“ oder > 350 Zeichen → nur protokolliert, Version +1, alter Regelstand in der Log-Notiz (Rollback). Error Workflow = ERR_notify. Test 973: Regel 1 gespeichert, Log + Kachel aktualisiert. |
| W30 | Workflow geändert | `SUB_log` | Workflow-Liste um `M_improve` ergänzt; stößt nach jeder Log-Zeile `M_cockpit_status` asynchron an. |
| W31 | Design neu | `M_cockpit_status` | Kachel „Agent-Status“: drei Gruppen (Täglich für dich · Auf Zuruf · Im Hintergrund), pro Funktion Ampelpunkt (🟢 ok, 🔴 Fehler oder fälliger Lauf fehlt, ⚪ noch nie gelaufen) und Uhrzeit in Monospace (Inline-Code) für einheitliche Spalten. Kopfzeile mit Gesamtstatus und Stand. „Agent-Hinweise“ im gleichen Format. |
| W32 | Logging ergänzt | `C_todos_hygiene`, `D_todo_capture`, `SUB_log` | Beide schreiben jetzt pro Lauf eine Agent-Log-Zeile (Hygiene auch bei „nichts zu tun“, Capture mit Diktat, angelegten To-dos und Siri-Antwort), damit Kachel und Lern-Schicht sie sehen. SUB_log erlaubt die beiden Workflow-Namen. Test 978. |
| N15 | Tabelle neu | Agent Cockpit „Funktionen“ | Gleiche Gruppen wie die Kachel plus „Infrastruktur“; Spalten Funktion · Was sie tut · Wann. Status steht nur noch in der Kachel. |
| W33 | Layout neu | `M_cockpit_status` + Headquarters/Cockpit | Status-Kachel aufgeteilt: schlanke Kopfzeile „Agent-Status“ (Gesamtstatus, Stand) und darunter drei schlichte Boards nebeneinander in Notion-Spalten (Täglich für dich · Auf Zuruf · Im Hintergrund), je Funktion Ampelpunkt, fetter Name, Uhrzeit in Monospace. Workflow lädt dafür zusätzlich Spalten und Spalteninhalt und erkennt die Boards an ihrer Überschrift. Test 981: 9 Blöcke auf beiden Seiten aktualisiert. |
| W34 | Apple-Ansicht | `M_cockpit_status` + Headquarters/Cockpit | Native Kopfzeile und Boards wieder entfernt (Notion kann Kästchen nicht weiß färben). Neu: Webhook GET `…/webhook/cockpit-…` (geheimer Pfad, im Node) liefert eine HTML-Ansicht im Apple-Stil: weiße abgerundete Gruppen auf #f5f5f7, Ampelpunkt, SF-Schrift, Uhrzeiten in SF Mono, immer hell (auch im Dark Mode weiß), Auto-Refresh 5 Min. Wird bei jedem Öffnen live aus dem Agent Log berechnet und ist oben im Headquarters und im Cockpit als Embed eingebunden. „Agent-Hinweise“ im Cockpit bleibt nativ. Test 982. Jeder Aufruf ist eine n8n-Ausführung. |
| W35 | Zurückgebaut | Headquarters/Cockpit | Embed bleibt in der Notion-iOS-App leer (Abruf 984 bei n8n erfolgreich, Inhalt wird nicht angezeigt; vermutlich Sicherheits-Sandbox von n8n für HTML-Antworten). Wieder die native Einzelkachel „Agent-Status“ (Gruppen, Ampel, Monospace). Webhook-Ansicht bleibt im Workflow, ist aber nirgends eingebunden. Test 986. |
| W36 | Zeitplan | `B_news_digest` | Evening Brief von 18:00 auf 17:00 (Schedule „Taeglich 08:00 und 17:00“, Europe/Berlin). Morning-Brief-Schlusszeile „Bis heute um 17 Uhr.“ Status-Kachel: Evening Brief fällig ab 18:00 (1 h Puffer). Cockpit-Tabelle und Strukturbild angepasst. |
| W37 | Farbe frei | `M_cockpit_status` | Update setzt keine Kastenfarbe mehr; die in Notion gewählte Farbe von „Agent-Status“ und „Agent-Hinweise“ bleibt erhalten. Test 988. |
| N16 | Widget neu | Headquarters ganz oben | Weltuhr im Apple-Stil: weiße Karte, Ortszeit groß (Zeitzone = Gerät, mit Kürzel und UTC-Versatz), daneben analoge Zifferblätter New York, Hongkong, London (London nur bei genug Breite; nachts dunkles Zifferblatt), Abstand „Heute, −6 Std.“. Als Link-Embed ohne Notion-Rahmen über `rawcdn.githack.com` (fest auf Commit `cb51b0b`; bei Änderungen neuen Commit-Hash eintragen). Quelle: `claude/widgets/uhr.html`. Erster Versuch als HTML-Anhang verworfen (Notion-Rahmen mit Dateiname). |

## Änderung 12.10.2026: Kosten-Tracking

Ziel: laufende Kosten sichtbar machen, ohne zusätzliche n8n-Ausführungen. Jeder Lauf meldet seine Kosten selbst, Notion rechnet live. Details und Kostenliste: `claude/rahmenbedingungen.md`.

| # | Aktion | Objekt | Details |
|---|---|---|---|
| N17 | Seite + DBs neu | Notion „Kosten & Verbrauch“ (unter Agent Cockpit) | DB **Kosten-Monate** (Monat, Start, Fixkosten, Budget, Credits-Kontingent, Ist laut Rechnung; Rollups Variabel €, Credits genutzt, Minuten, Läufe n8n; Formeln Gesamt bisher, Prognose, Status-Ampel, Credits %, n8n-Ausführungen ≈). DB **Kosten-Log** (eine Zeile je kostenpflichtigem Aufruf, Relation Monat). Zeilen 2026-10 bis 2026-12 angelegt: 44 € fix (n8n Starter 24 + ElevenLabs Creator ca. 20), Budget 60 € vorläufig, 100.000 Credits. Ansichten: Monatsübersicht, Kosten nach Funktion (Donut), Kosten pro Tag (Säulen), Teuerste Läufe. |
| N18 | Spalte neu | Agent Log „Kosten-Monat“ | Relation zu Kosten-Monate (Gegenstück „Agent-Läufe“), zählt n8n-Läufe pro Monat. |
| N19 | Spalte neu | Agent Config `preise_json` | USD je 1 Mio. Tokens [ein, Cache, aus] je Modell, Websuche 0,01 $, Kurs 0,90. |
| W38 | Workflow neu | `SUB_cost` (`yeA3NEIjiWKnz0HU`) | SUB_config → Preis berechnen → Monat in Kosten-Monate suchen (fehlt: anlegen) → Zeile im Kosten-Log. Nie hart fehlend (onError weiter), Error Workflow = ERR_notify. Ohne Tokens/Minuten/Credits passiert nichts. |
| W39 | Workflow geändert | `SUB_llm` | Nach Parse Output: Kosten melden (Usage aus der OpenAI-Antwort, Funktion aus `prompt_key`, Capture an `schema_name`) → SUB_cost asynchron → Rückgabe = Parse Output unverändert. Test 1001/1003. |
| W40 | Workflow geändert | `SUB_log` | Sucht vor dem Schreiben die Monatszeile und setzt die Relation „Kosten-Monat“. Fehlt sie, wird wie bisher ohne Relation geloggt. Test 1008. |
| W41 | Workflow geändert | `PA_orchestrator` | Nach Log schreiben: Kosten schätzen (Tokens aus Textlänge je Modellrunde, kalibriert an Exec 1005) → SUB_cost asynchron. Test 1005: Chat-Zeile im Kosten-Log, Agent-Log-Zeile mit Monat. |
| W42 | Workflow geändert | `D_daily_todo_call` | Zweiter Zweig am Post-Call-Webhook: Minuten, Credits, Test-Rabatt, Gegenwert → SUB_cost asynchron, auch bei Calls ohne Änderungen. Test 1015 (simuliert, Zeile neutralisiert). |
| W43 | Workflow geändert | `M_cockpit_status` | Liest zusätzlich die Monatszeile aus Kosten-Monate und schreibt in die Kachel „Agent-Status“ (Headquarters + Cockpit) den Abschnitt „KOSTEN <MONAT>“: bisher/Budget, Prognose, ElevenLabs-Credits, n8n-Ausführungen ≈, Link zur Kostenseite. Rote Budget-Ampel zählt als Problem. Keine zusätzliche Ausführung. Test 1038. |

Gemessen: Ein 63-s-Call kostet 223 Credits (Stimme 188 + LLM 35) mit Test-Rabatt der Talk-to-Seite. 90 Call-Minuten im Monat sind ca. 19 % des Creator-Kontingents.

## Audit-Log Session 3 (11.10.2026, 22:30–23:50)

Reihenfolge wie von Daniel vorgegeben: 1 Agent Log, 2 Prompts nach Notion, 3 Cache, 4 Zustand debugbar, 5 HMAC nur registrieren, 6 TODOS-Struktur unverändert, 7 Status-Standard, 8 Orchestrator, 9 Meta-Schicht.

### Notion
| # | Aktion | Objekt | Details |
|---|---|---|---|
| N5 | DB neu | Agent Log | Eine Zeile pro Lauf: Workflow, Typ, Status, Titel, Input, Entscheidung, Ergebnis, Modell, conversation_id, Dauer, Notiz, Execution-Link. Geschrieben von D_daily_todo_call, B_news_digest, PA_orchestrator, ERR_notify. |
| N6 | DB neu | Prompts | Key, Prompt, Version, Aktiv, Workflow, Ziel, Platzhalter, Beschreibung. Fünf Zeilen angelegt (siehe IDs). Inaktive oder fehlende Prompts lösen in SUB_llm einen klaren Fehler aus statt stiller Fallbacks. |
| N7 | Zeile geändert | Prompts `orchestrator.system` | Version 2: To-dos per `id` (bevorzugt) oder `nr`, neuer Aktionstyp `datum`, nach jeder Änderung erneut `todos_lesen`. |
| N8 | Spalte neu | Agent Config | `model_orchestrator` = `gpt-5.1` (Modell des Orchestrators, ohne Deploy änderbar). |
| N9 | TODOS | Zeilen | Status „offen“ und created_by „user“ bei 4 Alt-Einträgen nachgetragen. HMAC-Prüfung als To-do registriert (`3f682151-c6cc-81a9-b949-de021bc95cce`, Prio niedrig, bewusst nicht umgesetzt). Test-To-do des Orchestrators angelegt und wieder gelöscht (Papierkorb). Struktur der drei TODOS-Datenbanken unverändert (Punkt 6). |
| N10 | Seite neu | Meta-Reviews | Ablage der Wochen-Reviews der Claude-Routine. |

### n8n
| # | Aktion | Objekt | Details |
|---|---|---|---|
| W14 | Workflow neu | `SUB_log` | Schreibt eine Agent-Log-Zeile, Rich-Text in 2000-Zeichen-Blöcken, gibt `{ ok, page_id, error }` zurück, bricht nie den Aufrufer ab. |
| W15 | Workflow neu | `SUB_config` | Lädt Agent Config und aktive Prompts aus Notion, 5-Minuten-Cache in Static Data; Output meldet `cache: hit/miss`. |
| W16 | Workflow umgebaut | `SUB_llm` | Nimmt `prompt_key` + `vars` statt Prompt-Text; `system` nur noch als Zusatz. Config über SUB_config (vorher bei jedem Aufruf aus Notion). Fehlermeldung nennt den fehlenden Key. |
| W17 | Workflow neu | `SUB_state` + Data Table `pa_state` | Operationen get / get_kind / set (mit TTL) / delete / cleanup. Ersetzt Workflow Static Data: Zustand ist in n8n → Data Tables sichtbar und editierbar. |
| W18 | Workflow umgebaut | `D_daily_todo_call` | Tagesstatus, Pause und Call-Snapshots über SUB_state; Prompt `daily_call.aktionen` aus Notion; Agent-Log-Zeile nach jedem Call; Respond-Nodes antworten vor den Schreibvorgängen. Produktionsläufe 813, 818, 819, 823 grün. |
| W19 | Workflow umgebaut | `B_news_digest` | Prompts `digest.scoring` und `digest.redaktion` aus Notion, Agent-Log-Zeile nach dem Schreiben. |
| W20 | Workflow umgebaut | `ERR_notify` | Schreibt zusätzlich zur Fehlermail eine Agent-Log-Zeile (Typ fehler). |
| W21 | Workflow neu | `C_todos_hygiene` | Täglich 06:40: Einträge ohne Status oder created_by bekommen „offen“ / „user“. Testlauf 830: 1 Eintrag korrigiert (die leere Zeile aus Session 2). Error Workflow = ERR_notify. |
| W22 | Workflow neu | `SUB_todos_apply` | Gleiche Aktionslogik wie im Daily-Call, als Tool nutzbar: Input `{ aktionen }` (JSON-Array), lädt die Liste frisch, ordnet per `id` oder `nr`, Output `{ ok, log, fehler, anzahl, zusammenfassung }`. |
| W23 | Workflow neu | `PA_orchestrator` | Chat Trigger (Chat Hub, n8n-Login, Streaming) + Webhook POST → Eingabe normalisieren → SUB_config → System-Prompt `orchestrator.system` mit {{heute}}/{{wochentag}} → AI Agent (OpenAI, Modell aus `model_orchestrator`, Simple Memory je sessionId, Tools todos_lesen / todos_aendern / notion_suchen / notion_lesen) → Webhook-Antwort → Agent-Log-Zeile. Zeitzone Europe/Berlin, Error Workflow = ERR_notify. |
| W24 | Tests (Produktion) | `PA_orchestrator` | 831 Webhook „Was steht heute an?“ → todos_lesen, Antwort mit 3 Heute-Punkten, 6 s. 835 „neues To-do anlegen“ → todos_lesen + todos_aendern(neu), Seite in Notion angelegt. 845 gleiche Session „lösche das Test-To-do“ → Memory erkannte das To-do, Löschung per `id` in den Papierkorb. 838 Chat-Trigger (manuell) → 3 s, Log-Zeile ohne Webhook-Antwort. Jeder Lauf hat eine Agent-Log-Zeile mit Execution-Link. |

Nicht verändert: Credentials, Webhook-Pfade des Daily-Calls, ElevenLabs-Agent (Prompt liegt nur als Kopie in Notion), die drei TODOS-Datenbanken.

### Claude
| # | Aktion | Objekt | Details |
|---|---|---|---|
| P3 | Routine angelegt | „PA Meta-Review (wöchentlich)“ | Sonntags 17:47 Berlin, neue Session je Lauf, Push-Benachrichtigung. Liest Agent Log, n8n-Fehler, TODOS und Prompts der Woche, schreibt Review-Seite unter Meta-Reviews und eine Agent-Log-Zeile, schlägt Verbesserungen vor, ändert nichts. **Connectoren (Notion, n8n) konnten per MCP nicht hinterlegt werden → O9.** Version 1, Erweiterung um Real-Life-Ziele nach Brainstorming (O13). |
| P4 | Doc aktualisiert | `claude/daily-todo-call-setup.md` | Dieses Dokument. |

## Historie: Audit-Log Session 2 (11.10.2026, 21:55–22:20)

### n8n
| # | Aktion | Objekt | Details |
|---|---|---|---|
| W7 | Workflow neu | `SUB_todos` | Einzige Quelle für die To-do-Liste. Notion-Query filtert serverseitig (Status leer oder ≠ erledigt), sortiert Liste › Prio › Erstellung, nummeriert, baut Listentext. Output: `{ todos[], liste_text, heute, wochentag, ist_montag, anzahl_offen, anzahl_heute, warnung }`. Retry 3×. Veröffentlicht. |
| W8 | Workflow neu | `ERR_notify` | Error Trigger → Mail an Daniel (Workflow, Node, Fehlermeldung, Execution-Link). Veröffentlicht. |
| W9 | Workflow umgebaut | `D_daily_todo_call` | Die drei kopierten HTTP+Code-Paare (Kontext / Nach Call / 12 Uhr) durch Aufrufe von `SUB_todos` ersetzt. Neu: Snapshot der nummerierten Liste pro `conversation_id` beim Kontext-Aufruf, Wiederverwendung nach dem Call (Fallback: frische Liste). `Status-Logik` schreibt Static Data nur noch bei echten Änderungen (nicht bei jedem `check`). `Notion aktualisieren` mit Retry (2×, 1 s). Error Workflow = `ERR_notify`. Sticky Note und Gruppen aktualisiert. Veröffentlicht (Version `e184dd71`). |
| W10 | Settings | `B_news_digest` | Error Workflow = `ERR_notify`, veröffentlicht (keine Logikänderung). |
| W11 | Sticky Note | `SUB_llm` | Veralteter Warnhinweis („läuft auf n8n-Testcredits“) ersetzt – der LLM-Node nutzt längst das eigene Credential „OpenAI account“. Veröffentlicht. |
| W12 | Ordner | `B_feedback` | Von der Projekt-Wurzel in „Personal AI Agent“ verschoben (gehört zu `B_news_digest`). |
| W13 | Tests (Produktion) | `D_daily_todo_call` | Exec 807 `/context`: 11 offene To-dos, korrekt gefiltert und nummeriert, Snapshot gespeichert. Exec 809 `/status?action=check`: `frage: nein, reason: ausserhalb 7:30-12:00`. Exec 810 `/postcall` mit Test-Transkript „keine Änderungen“ (gleiche conversation_id): Snapshot gefunden und genutzt (`todos_quelle: snapshot`), LLM → 0 Aktionen, Notion unverändert, Bestätigungsmail „Daily So 11.10.: 0 Änderungen“ gesendet. Nebeneffekt: Tagesstatus für den 11.10. steht auf `done`. |

Nicht verändert: Credentials, `SUB_llm`-Logik, `B_news_digest`-Logik, Webhook-Pfade, Prompt und erste Nachricht des Agenten.

### ElevenLabs
| # | Aktion | Objekt | Details |
|---|---|---|---|
| E8 | Tool geändert | `todos_abrufen` | Body jetzt `{ quelle: "elevenlabs_agent", conversation_id: {{system__conversation_id}} }`. Nötig für den Snapshot. URL, Name, Timeout unverändert. |
| E9 | Turn-Taking | Agent | `silence_end_call_timeout` -1 → **45 s** (vorher lief ein Call bei Stille bis zum 6-Minuten-Limit weiter und kostete). Soft-Timeout-Text auf Deutsch gesetzt, bleibt deaktiviert. |
| E10 | Verhalten | Agent | Nachricht bei Zeitlimit gesetzt: „Die Zeit ist um. Alles, was du bestätigt hast, landet gleich in Notion und per Mail bei dir. Bis morgen, Daniel!“ (vorher: stummer Abbruch). |
| E11 | Stimme | Agent | Versuch Silke (`a9xTHeUqm2s31ct5pQck`) → `voice_not_found`. Library-Stimmen müssen erst in „My Voices“ liegen. **Weiterhin Standardstimme** (`cjVigY5qzO86Huf0OWal`, englisch). Siehe O1. |

Geprüft und in Ordnung: LLM `gemini-3.8-flash`, Temperatur 0,3, TTS `eleven_v4_turbo` (mehrsprachig), Sprache `de`, max. 360 s, `end_call` aktiv, Limits 10 Calls/Tag, 1 gleichzeitig, Post-Call-Webhook-Events auf `transcript` (JSON, ohne Audio).

### Notion
Nichts geändert. Beobachtungen:
- Eine leere Zeile ohne Titel (`3ed82151-c6cc-8096-b8aa-c31811dfcf34`, Liste „Diese Woche“) liegt in TODOS. Sie wird von `SUB_todos` ignoriert, kann gelöscht werden.
- Manuell angelegte Einträge haben oft keinen `Status` (leer statt „offen“). Der Filter behandelt leer als offen, das ist abgedeckt.

### Claude-Projekt
| # | Aktion | Objekt |
|---|---|---|
| P2 | Doc aktualisiert | `claude/daily-todo-call-setup.md` (dieses Dokument), im Repo `first-project-` auf Branch `claude/ecstatic-lovelace-uui5vx` |

## Offen
| # | Was | Wer |
|---|---|---|
| O1 | Erledigt 12.10.: Daniel hat eine Stimme gesetzt (`ZvWcrHaSI2mBg4j0XUCH`). | – |
| O2 | Erledigt 12.10.: Post-Call-Webhook eingetragen, drei Calls sind mit Änderungen in Notion gelandet. | – |
| O3 | Twilio-Konto + deutsche Nummer, dann Import + Agent zuweisen. Optional: Weg 1 (Browser-Link im Kurzbefehl) ersetzt den Anruf und kostet halbe Credits. | Daniel, optional |
| O4 | iPhone-Kurzbefehle „Agentin“ und „Daily-Check“ + Automation (Anleitung unten) | Daniel |
| O5 | 12-Uhr-Fallback (Schedule im Workflow) wieder aktivieren, optional als Rückruf | ich, nach O3 |
| O6 | **Workspace bestätigen:** In ElevenLabs prüfen, dass `agent_2601…` in „My Workspace“ liegt. | Daniel |
| O7 | n8n `TEMP LG source probe` (`aZuPjAIYwf2Gd5TR`, inaktiv) archivieren, falls nicht mehr gebraucht | Daniel |
| O8 | Optional: Audio-Aufbewahrung im Agent auf 30 Tage begrenzen (`retention_days: -1`). | Daniel oder ich |
| O9 | **Routine-Connectoren:** claude.ai → Routines → „PA Meta-Review (wöchentlich)“ öffnen und Notion + n8n als Connectoren hinzufügen (per MCP nicht möglich). Ohne das hat der Sonntagslauf keinen Zugriff und legt nur eine Seite mit Fehlerhinweis an. | Daniel |
| O10 | **Orchestrator ausprobieren:** n8n → Chat → Agent „Personal Agent“. Oder iPhone-Kurzbefehl: POST auf den Orchestrator-Webhook mit Body `{ "text": "…", "sessionId": "iphone" }`, Antwort steht in `antwort`. | Daniel |
| O11 | HMAC-Prüfung Post-Call-Webhook (als To-do registriert, bewusst nicht umgesetzt). Der Orchestrator-Webhook ist ebenso nur durch den geheimen Pfad geschützt; Header-Auth wäre der nächste Schritt. | ich, wenn O2 steht |
| O12 | Notion TODOS: Datenbank-Vorlage mit Status „offen“ als Standard-Vorlage setzen (die API kann keinen Select-Default). C_todos_hygiene fängt den Rest täglich 06:40 ab. | Daniel |
| O13 | Meta-Schicht v2: Brainstorming-Session Real-Life-Ziele, danach Routine-Prompt erweitern (Ziele-DB, Wochenfokus, Bewertung gegen Ziele). | Daniel + ich |
| O14 | n8n-Credential „Anthropic account“ (`4I2o0NaJ53VvT7bL`) liefert keine Modellliste, vermutlich ungültig. Orchestrator läuft deshalb auf OpenAI. Optional neu anlegen, dann `model_orchestrator` umstellen (Node-Tausch nötig). | Daniel |

## Agent selbst konfigurieren
Dashboard: https://elevenlabs.io/app/agents/agents/agent_2601m4p82ey6ew8bnejvezdmrt9x
Browser-Test: https://elevenlabs.io/app/talk-to?agent_id=agent_2601m4p82ey6ew8bnejvezdmrt9x

Frei änderbar: Stimme, Tempo, Prompt-Ton, erste Nachricht, Modell, max. Dauer.
Nicht ändern (sonst bricht die Kette): Tool `todos_abrufen` (URL, Name, Body-Felder `quelle` und `conversation_id`) und die Prompt-Zeile „Rufe direkt nach deiner Begrüßung das Tool todos_abrufen auf“.

**Erste Nachricht (aktuell):**
> Morgen Daniel! Moment, ich hol kurz deine Liste.

**Modell (seit 12.10.2026):** gpt-5.4-mini, Reasoning aus, Temperatur 0,3. Grund: gpt-5.4-nano (von Daniel wegen Latenz gesetzt) las alle Punkte mit wiederholter Frage am Stück vor. Nächste Stufe bei Bedarf: gemini-3.8-flash mit Denken aus.

**System-Prompt v2 (12.10.2026, gilt auch als Kopie in Notion „Prompts“ unter `elevenlabs.todo_agent.system`):** Kern: pro Nachricht genau ein Punkt und eine Frage; Tempo-Regeln für „beeil dich“ und „stopp“; Sammelantworten übernehmen. Der frühere Prompt (v1) ist unten als Historie erhalten.

**System-Prompt v1 (Session 1, abgelöst):**
```
Du bist Daniels To-do-Agent. Ihr geht am Telefon in maximal 4 bis 5 Minuten seine To-do-Liste durch. Sprich Deutsch, kurz und direkt, wie ein guter Assistent. Keine langen Sätze, kein Vorlesen der ganzen Liste, keine Floskeln.

Start:
- Rufe direkt nach deiner Begrüßung das Tool todos_abrufen auf. Es liefert die nummerierte Liste (todo_liste), Datum, Wochentag und ob Montag ist (ist_montag).
- Schlägt das Tool fehl, sag das kurz und frag Daniel, was heute ansteht. Nimm seine Antworten trotzdem auf.

Ablauf:
1. Gehe die Punkte unter „Heute" einzeln durch (Nummer und Kurztitel). Frage jeweils: erledigt, bleibt heute, verschieben oder streichen?
2. „Diese Woche" nur kurz: Kommt davon etwas auf heute?
3. Frage nach Neuem. Neue Aufgaben kurz und konkret wiederholen, mit Liste (heute, diese Woche oder später).
4. Wenn ist_montag = ja: Wochenplanung. Gehe die Punkte unter „Später" zügig durch und frage, was diese Woche drankommt oder gestrichen wird.
5. Lege mit Daniel die Top 3 für heute fest.
6. Fasse am Ende alle Änderungen in einem Satz zusammen und lass sie bestätigen. Dann kurz verabschieden und das Gespräch beenden.

Regeln:
- Du änderst selbst nichts. Alles, was Daniel bestätigt, wird nach dem Anruf automatisch in Notion eingetragen und per Mail bestätigt. Sag das bei Bedarf in einem Halbsatz.
- Steht bei einem Punkt „x verschoben" (3 oder mehr), fordere eine Entscheidung: heute machen, abgeben oder streichen.
- Will Daniel die Calls pausieren, frag nach dem Datum („bis wann?") und wiederhole es.
- Unklare Aussagen kurz nachfragen statt raten.
- Hat Daniel wenig Zeit, nur Punkt 1 und 5.
- Nach etwa 4 Minuten aktiv zum Abschluss kommen.
```

## iPhone: Agentin ohne Anruf öffnen (Weg 1, seit 12.10.2026)

Die Agentin läuft im Browser über die ElevenLabs-Gesprächsseite, kein Twilio nötig. Gespräche über diese Seite gelten bei ElevenLabs als Test und kosten den halben Credit-Preis (Flag `dev_discount`).

**Link:** `https://elevenlabs.io/app/talk-to?agent_id=agent_2601m4p82ey6ew8bnejvezdmrt9x` (in Safari bei ElevenLabs eingeloggt sein).

### Kurzbefehl „Agentin“ (Icon auf dem Homescreen, ca. 2 Min.)
1. Kurzbefehle-App → „+“ → Name „Agentin“.
2. Aktion **„URLs öffnen“** hinzufügen, URL = Link oben. (Nicht „Webseite anzeigen“, sonst läuft es im Mini-Browser ohne Login.)
3. Oben auf den Namen tippen → **„Zum Home-Bildschirm“** → Icon und Farbe wählen → „Hinzufügen“.
4. Erster Start: Safari fragt nach Mikrofon → „Erlauben“ und „Für diese Website merken“. Danach: Icon tippen → „Start“ tippen → sprechen.

### Kurzbefehl „Daily-Check“ (mit Tagesstatus aus n8n, ca. 3 Min.)
`BASIS` = Webhook-Basis-URL des Daily-Calls aus n8n (steht im Webhook-Node, geheim):
1. **Inhalte von URL abrufen:** `BASIS/status?action=check`
2. **Wörterbuchwert abrufen:** Schlüssel `frage`
3. **Wenn** `frage` **ist** `ja`:
   - **Aus Menü auswählen** – Titel „Daily jetzt?“
     - **Jetzt:** Inhalte von URL abrufen (`BASIS/status?action=call`) → **URLs öffnen** (Link oben)
     - **In 30 Min.:** Inhalte von URL abrufen (`BASIS/status?action=snooze`)
     - **Heute nicht:** Inhalte von URL abrufen (`BASIS/status?action=skip`)
4. **Ende Wenn**

Automationen (Kurzbefehle → Automation → „Sofort ausführen“, Kurzbefehl „Daily-Check“):
- **Tageszeit** 7:30, täglich (öffnet Safari, wenn das iPhone entsperrt ist, sonst Mitteilung)
- optional **App** „Wird geöffnet“ (3–5 Morgen-Apps) oder **Ladegerät** „Wird getrennt“

Fragt nur zwischen 7:30 und 12:00 und nur, solange der Daily offen ist. `action=reset` setzt Tagesstatus und Pause zurück. Twilio (O3) bleibt optional für echte Anrufe.

## Kosten (Schätzung, 150 Min./Monat)
**Überholt am 12.10.2026:** Aktuelle Kostenliste mit n8n-Abo und Messwerten steht in `claude/rahmenbedingungen.md` (Okt.–Dez. ca. 46–53 €/Monat, danach ca. 30–37 €). Live-Stand: Notion „Kosten & Verbrauch“. Die Zahlen unten bleiben als Historie.

ElevenLabs Starter + Mehrminuten ca. 12,75 € · Twilio (überwiegend eingehend) ca. 3–4 € · Sprachmodelle ca. 1 € → **ca. 16–17 €/Monat**. Durch das 45-Sekunden-Stille-Limit (E9) fallen keine „vergessenen“ Call-Minuten mehr an.
Neu: PA_orchestrator mit gpt-5.1, ca. 2–3 k Tokens je Nachricht → bei 20 Nachrichten/Tag grob 2–4 €/Monat (Schätzung). Config-Cache spart je LLM-Aufruf zwei Notion-Abfragen.

---

## Historie: Audit-Log Session 1 (11.10.2026, bis 21:10)

### Notion – TODOS (Daniel's Headquarters)
| # | Aktion | Objekt | Details |
|---|---|---|---|
| N1 | Felder gelöscht | Data Source `b8065b38-…-e8708fc1b680` | `source_id`, `first_seen_at`, `last_seen_due` |
| N2 | Feld geändert | „Liste“ | Optionen Heute / Diese Woche / Broader Timeframe, Beschreibung „Führend. Steuert die Planung.“ |
| N3 | Feld geändert | „Datum“ | Beschreibung „Optional. Nur für harte Deadlines.“ |
| N4 | Test-Eintrag | „TEST Daily-Agent“ | angelegt und wieder gelöscht (liegt im Papierkorb) |

### n8n
| # | Aktion | Objekt | Details |
|---|---|---|---|
| W1 | Workflow neu | `D_daily_todo_call` (ID `7RHkHLnrUrcwCndH`) | Ordner „Personal AI Agent“, Zeitzone Europe/Berlin, veröffentlicht + aktiv |
| W2 | Webhook | „Kurzbefehl Status“ GET `…/status` | iPhone fragt: heute Daily? (nur 7:30–12:00, 1× pro Tag) |
| W3 | Webhook | „Agent Kontext“ POST `…/context` | liefert Agent die nummerierte Liste aus Notion |
| W4 | Webhook | „Nach dem Call“ POST `…/postcall` | Transkript → LLM (SUB_llm) → Notion-Änderungen → Bestätigungsmail |
| W5 | Zeitplan | „Täglich 12:00“ | **deaktiviert**, bis Telefonnummer steht |
| W6 | Tests | 5 manuelle Ausführungen | 2 Testmails an dittmann.daniel@icloud.com gesendet |

### ElevenLabs (Session 1, alte IDs, vermutlich durch Umzug ersetzt)
| # | Aktion | Objekt | Details |
|---|---|---|---|
| E1 | Tool neu | `todos_abrufen` (`tool_6401m4p5qsx9fxwa163d4cq4epcd`) | Webhook POST → `…/context`, Timeout 15 s |
| E2 | Agent neu | „To-do Agent (Daily)“ (`agent_9401m4p5v600f9pvfb3h5fbrjwg0`) | Deutsch, Tags daily/todo/personal |
| E3 | Prompt + Modell | Agent | Gemini Flash, Temperatur 0,3, Zeitzone Europe/Berlin, Tool E1 angehängt |
| E4 | Gespräch | Agent | max. 6 Min. pro Call |
| E5 | Auflegen | Agent | Built-in „end_call“ aktiv |
| E6 | Betrieb | Agent | Trust „high“, max. 10 Calls/Tag, 1 gleichzeitig, kein Bursting |
| E7 | Stimme | Agent | Standardstimme (`cjVigY5qzO86Huf0OWal`) – deutsche Stimme konnte nicht gesetzt werden |
