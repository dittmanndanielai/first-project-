# Kurzbefehle für den Personal Agent

## Agentin.shortcut
Öffnet die ElevenLabs-Gesprächsseite des Daily-Agenten in Safari (kein Anruf, kein Twilio, halber Credit-Preis).

Die Datei ist unsigniert. iOS und macOS importieren nur signierte Kurzbefehle. Signieren auf dem Mac (Terminal):

    shortcuts sign --mode anyone --input Agentin.shortcut --output Agentin-signed.shortcut
    open Agentin-signed.shortcut

Danach erscheint „Agentin“ in der Kurzbefehle-App und synchronisiert per iCloud aufs iPhone.
Auf dem iPhone: Kurzbefehle → „Agentin“ → ⋯ → Name antippen → „Zum Home-Bildschirm“.
Erster Start in Safari: Mikrofon erlauben und „Für diese Website merken“. Login bei ElevenLabs nötig.
