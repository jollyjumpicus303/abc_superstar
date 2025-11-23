# Entwickler-Tools (Debug-Panel) – Spec

Dieses Dokument beschreibt, wie der Entwicklermodus für lokale Tests von Rewards, Medaillen und Statistiken umgesetzt wird.

## Ziele
- QA kann Sternbank, Sticker-Packs und Medaillen-Hooks manuell auslösen, ohne ein Spiel zu spielen.
- Aktivierung bleibt explizit (Flag/Hotkey), standardmässig unsichtbar und wirkt nur lokal auf das aktive Profil.
- UI sitzt im Eltern-Hub (Tab „Übersicht“), damit es nicht mit Kinderflows kollidiert.

## Aktivierung & Guardrails
- Flag in `localStorage` (`abc_abenteuer_devtools = '1'`), Hotkey `Ctrl+Shift+D` (Mac: `Cmd+Shift+D`).
- URL-Parameter `?devtools=1` oder `?debug=1` setzt das Flag einmalig.
- Banner im Eltern-Hub zeigt Status + Schalter „Panel öffnen/Deaktivieren“.
- Keine Netzwerk-Calls; alle Aktionen nutzen bestehende lokale Stores (`IDB`/`localStorage`) und das aktive Profil/Set.

## UI-Platzierung
- Standort: `parentHub` → Tab „Übersicht“.
- Elemente:
  - **Banner:** Hinweis „Entwicklermodus aktiv“, Hotkey + URL-Hinweis, Buttons „Panel öffnen“ / „Deaktivieren“.
  - **Panel (hub-block, devtools):** Drei Karten in einem Grid.
    - **Sterne & Packs:** Input (aktueller Stand), Buttons `Setzen`, Deltas (+1/+5/+10/-5), `Bank leeren`, `🎁 Gratis-Pack öffnen` (ohne Stern-Abzug). Aktualisiert Star-Track + Album.
    - **Medaillen & Run-Simulation:** Buttons `Intro`, `Gold/Silber/Bronze` (nutzt Custom-Clips aus aktivem Set, sonst Standards). Run-Simulation: Select Medaille + Input Sterne (0–5) → spielt Intro + Jubel, animiert Star-Reveal, addiert Sterne zum Konto.
    - **Stats & Sticker:** Input Buchstabe → `Stat +1` (nutzt `incrementLetterStat`). Button `🎟️ Sticker hinzufügen` versucht fehlenden Sticker zu vergeben (oder zufällig). Optionaler Status-Text mit Ergebnis.

## Technische Hooks
- Stars: `getStars` / `setStars` / `addStars` + `updateStarTrackDisplay` + `renderAlbum()` (für UI-Sync).
- Sticker: `openStickerPack()`, `addSticker()`, `getCollectedStickers()`; Picker bevorzugt fehlende Sticker.
- Medaillen: `playMedalIntroSound()` + `playMedalCelebration(type)`; Fallback `playRewardSound()` bei fehlenden Custom-Clips.
- Star-Reveal: `updateStarSummary()` + `getStarRevealWidget().setStars(...)` für Sichtprüfung der Anzeige.
- Stats: `incrementLetterStat(letter)` nutzt aktive Profilebene.

## Akzeptanzkriterien
- Ohne Flag bleiben Banner/Panel unsichtbar und haben keine Seiteneffekte.
- Hotkey/URL-Flag aktiviert den Banner und persistiert den Zustand lokal; „Deaktivieren“ entfernt das Flag.
- Alle Aktionen aktualisieren sofort den sichtbaren UI-State (Star-Track, Album, ggf. Stat-Rückmeldung).
- Medaillen-Buttons nutzen die vorhandenen Custom-Sounds aus dem aktiven Set; bei fehlenden Clips kein Fehler/Abbruch.
- Status-/Fehlerfeedback wird im Panel angezeigt (keine Browser-Alerts nötig).
