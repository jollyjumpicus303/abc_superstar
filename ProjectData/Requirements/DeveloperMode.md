# Entwicklermodus für Rewards & Statistik-Tests

Ziel: Einen lokalen Entwicklermodus bereitstellen, mit dem man Sterne, Medaillen, Sticker und Statistiken ohne reguläres Gameplay simulieren kann. So lassen sich Sound-Hooks, Pack-Logik und UI-States schnell überprüfen.

## Anforderungen
- **Aktivierung nur lokal:** Hidden-Flag (URL `?devtools=1` / `?debug=1` oder LocalStorage) + Hotkey `Ctrl+Shift+D`. Standardmässig aus; kein separater Build nötig.
- **Sichtbarkeit im Eltern-Hub:** Banner in der Übersicht zeigt, dass der Entwicklermodus aktiv ist, und verlinkt auf ein Panel mit den Tools.
- **Panel „Entwickler-Tools“:** Im Eltern-Hub (Übersicht) als eigener Block.
  - Sterne-Bank setzen/adjustieren (+/- Buttons) und gratis Sticker-Pack öffnen (ohne Stern-Abzug) – wirkt auf das aktive Profil.
  - Medaillen-Flows testen: Intro-Sound + Gold/Silber/Bronze-Jubel abspielen, inkl. Custom-Clips aus dem aktiven Set.
  - Run-Simulation: Medaille wählen, Sternanzahl vorgeben, Stars hinzufügen (Update UI + Star-Track/Album).
  - Sticker/Stats: Single-Sticker hinzufügen (möglichst fehlender), Buchstaben-Statistik für einen Buchstaben hochzählen.
- **Safety:** Wirkt nur lokal und nur auf das aktive Profil/Set. Keine API-Calls, kein Tagging. Panel soll klar als „nur lokal“ gekennzeichnet sein.

## Akzeptanzkriterien
- Flag/Hinweis im UI ist standardmässig unsichtbar und erscheint nur bei aktivem Entwicklermodus (URL/Hotkey/LocalStorage).
- Panel steht im Eltern-Hub → Tab „Übersicht“, ohne das Standard-Layout zu stören.
- Aktionen aktualisieren sofort die sichtbaren Werte (Sternbank, Sticker-Album, Medaillen-Sounds, Statistiken) für das aktive Profil.
- Medaillen-Buttons triggern die vorhandenen Sound-Hooks (Intro + Custom-Clips); Stern-Buttons passen den Star-Track an.
- Dokumentation (Requirements, Specs, README) beschreibt Aktivierung und Funktionsumfang; Task im Backlog erfasst.
