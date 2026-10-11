# Daily To-do Call – Setup & Audit-Log

Stand: 11.10.2026, 22:20 · Session 2 (Struktur-Review und Fixes). Session 1 (Erstaufbau) ist unten als Historie erhalten.

## Architektur (aktuell)

```
iPhone-Kurzbefehl ──GET /status──▶ D_daily_todo_call ─▶ ja/nein (7:30–12:00, 1× pro Tag)

ElevenLabs "To-do Agent (Daily)"
   └─ Tool todos_abrufen ──POST /context──▶ D_daily_todo_call ─▶ SUB_todos (Notion) ─▶ nummerierte Liste
                                                                └─ Snapshot pro conversation_id (Static Data)
   └─ Post-Call-Webhook ──POST /postcall──▶ D_daily_todo_call ─▶ Snapshot (oder SUB_todos) ─▶ SUB_llm ─▶ Notion ─▶ Bestätigungsmail

12:00 (deaktiviert) ─▶ Daily noch offen? ─▶ SUB_todos ─▶ Erinnerungsmail
Jeder Fehler in D_daily_todo_call / B_news_digest ─▶ ERR_notify ─▶ Fehlermail
```

Notion bleibt die einzige Wahrheit für To-dos. n8n hält nur Tagesstatus, Pause und die Call-Snapshots (Workflow Static Data).

## IDs und Orte

| System | Objekt | ID / Ort |
|---|---|---|
| n8n | `D_daily_todo_call` | `7RHkHLnrUrcwCndH`, Ordner „Personal AI Agent“, aktiv |
| n8n | `SUB_todos` (neu) | `0JbiuOaUkaiGZZAp`, Ordner „Personal AI Agent“, veröffentlicht |
| n8n | `ERR_notify` (neu) | `o6l8HeuZhUNK64IT`, Ordner „Personal AI Agent“, veröffentlicht |
| n8n | `SUB_llm` | `SEPkupoYoj8yqV7p` (nur genutzt) |
| n8n | Webhook-Basis | `https://danieldtmn.app.n8n.cloud/webhook/todo-…/` – vollständige URL steht im Webhook-Node, enthält geheimen Teil, nicht teilen |
| ElevenLabs | Agent „To-do Agent (Daily)“ | `agent_2601m4p82ey6ew8bnejvezdmrt9x` |
| ElevenLabs | Tool `todos_abrufen` | `tool_5101m4p81tejfw0vk83g53zsr748` |
| Notion | TODOS Data Source | `b8065b38-5580-43fc-b022-e8708fc1b680` (Daniel’s Headquarters / AI Operating System) |

Hinweis: Die IDs aus Session 1 (`agent_9401…`, `tool_6401…`) tauchen im Connector nicht mehr auf. Der Connector sieht genau einen Agenten mit den neuen IDs, angelegt 11.10. 21:47 Uhr. Das ist sehr wahrscheinlich der Umzug nach „My Workspace“ aus einem anderen Chat. Bitte einmal in der ElevenLabs-Oberfläche bestätigen (siehe Offen O6).

## Audit-Log Session 2 (11.10.2026, 21:55–22:20)

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
| O1 | **Deutsche Stimme:** ElevenLabs → Voices → Library → „Silke - Relaxed & Friendly“ → „Add to My Voices“. Dann entweder im Agent auswählen oder mir Bescheid geben, dann setze ich sie per Connector. Alternativen (alle Library, weiblich, Hochdeutsch): Nellie, Lola - Modern Agent, Nadine - Friendly Conversational, Mrs. Sophie. | Daniel |
| O2 | **Post-Call-Webhook:** ElevenLabs → Agents → Settings → Post-call webhook → URL `…/postcall` (Transcription). Ohne das landet nichts in Notion. Nicht über den Connector möglich. | Daniel |
| O3 | Twilio-Konto + deutsche Nummer, dann Import + Agent zuweisen | Daniel, dann ich |
| O4 | iPhone-Kurzbefehl „Daily-Check“ + Automationen (Anleitung unten) | Daniel |
| O5 | 12-Uhr-Fallback (Schedule im Workflow) wieder aktivieren, optional als Rückruf | ich, nach O3 |
| O6 | **Workspace bestätigen:** In ElevenLabs prüfen, dass `agent_2601…` in „My Workspace“ liegt und „To-do Agent (Daily)“ in Daniel’s Workspace gelöscht ist. | Daniel |
| O7 | n8n `TEMP LG source probe` (`aZuPjAIYwf2Gd5TR`, inaktiv, seit 5.10.) archivieren, falls nicht mehr gebraucht | Daniel |
| O8 | Optional: Audio-Aufbewahrung im Agent ist unbegrenzt (`retention_days: -1`). Für einen täglichen Privat-Call reichen 30 Tage. | Daniel oder ich |

## Agent selbst konfigurieren
Dashboard: https://elevenlabs.io/app/agents/agents/agent_2601m4p82ey6ew8bnejvezdmrt9x
Browser-Test: https://elevenlabs.io/app/talk-to?agent_id=agent_2601m4p82ey6ew8bnejvezdmrt9x

Frei änderbar: Stimme, Tempo, Prompt-Ton, erste Nachricht, Modell, max. Dauer.
Nicht ändern (sonst bricht die Kette): Tool `todos_abrufen` (URL, Name, Body-Felder `quelle` und `conversation_id`) und die Prompt-Zeile „Rufe direkt nach deiner Begrüßung das Tool todos_abrufen auf“.

**Erste Nachricht (aktuell):**
> Morgen Daniel! Moment, ich hol kurz deine Liste.

**System-Prompt (aktuell, unverändert seit Session 1):**
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

## iPhone-Kurzbefehl „Daily-Check“ (Daniel, ca. 3 Min.)
Kurzbefehle-App → neuer Kurzbefehl „Daily-Check“ (`BASIS` = Webhook-Basis-URL aus dem n8n-Workflow):
1. **URL:** `BASIS/status?action=check`
2. **Inhalte von URL abrufen**
3. **Wörterbuchwert abrufen:** Schlüssel `frage`
4. **Wenn** Wörterbuchwert **ist** `ja`:
   - **Aus Menü auswählen** – Titel „Daily jetzt?“
     - **Jetzt anrufen:** Inhalte von URL abrufen (`BASIS/status?action=call`) → **Anrufen** (Kontakt „To-do“)
     - **In 30 Min.:** Inhalte von URL abrufen (`BASIS/status?action=snooze`)
     - **Heute nicht:** Inhalte von URL abrufen (`BASIS/status?action=skip`)
5. **Ende Wenn**

Automationen (jeweils „Sofort ausführen“, Kurzbefehl „Daily-Check“):
- **App** → „Wird geöffnet“ → 3–5 Morgen-Apps (z. B. WhatsApp, Instagram, Mail)
- **Ladegerät** → „Wird getrennt“
- **Wecker** → „Wird gestoppt“ (Bonus)

Fragt nur zwischen 7:30 und 12:00 und nur, solange der Daily offen ist. `action=reset` setzt Tagesstatus und Pause zurück.

## Kosten (Schätzung, 150 Min./Monat)
ElevenLabs Starter + Mehrminuten ca. 12,75 € · Twilio (überwiegend eingehend) ca. 3–4 € · Sprachmodelle ca. 1 € → **ca. 16–17 €/Monat**. Durch das 45-Sekunden-Stille-Limit (E9) fallen keine „vergessenen“ Call-Minuten mehr an.

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
