# Changelog

All notable changes to this project are documented here. Releases are tagged via Git (see `Rules.md` for tag conventions).

## [Unreleased]
- [repo] Island-Variante und zugehoerige Design-Dokumente entfernt.
- [classic] Sonnig/Nachthimmel Farb-Tokens an Island-Palette angeglichen (Root-CSS-Tokens & Theme-Color).
- [classic] Eltern-Hub eingeführt (Single Entry über Zahnrad, Parental-Gate mit 10s-Timeout, interne Tabs für Übersicht/Aufnahmen/Sets & Extras).
- [theme][nebula] Eltern-Hub in Nachthimmel-Theme visuell angeglichen (Tabs/Status-Kacheln/Blöcke).
- [audio][classic] Manuelle Aufnahmen fordern jetzt Echo-/Noise-Reduction (Mono/48 kHz) an; fällt auf Standard zurück, falls der Browser die Filter nicht unterstützt.
- [audio][classic] Medal celebration avoids overlapping default SFX when custom medal clips exist.
- [profiles] Emoji-Avatar Randomizer mit 🔄-Button (globale Duplikate vermeiden, manueller Override möglich, Editor im Eltern-Hub).
- [profiles][ui] Avatar-Reroll-Button auf SVG-Icon mit größerer Hit-Area und passender Gradient-Styling umgestellt (Classic), Text-Hint auf „Neu würfeln“ angepasst.
- [parent-hub] Aufnahmen- und Set-Verwaltung zu „Aufnahmen & Sets“ zusammengeführt; Set-Wechsel direkt beim Aufnehmen möglich; Profilkarten schalten Statistiken per Klick um.
- [devtools] Lokaler Entwicklermodus (Hotkey/URL-Flag) mit Banner + Panel im Eltern-Hub: Sternbank steuern, Sticker-Packs simulieren, Medaillen-/Run-Simulation und Statistikhilfen.
- [parent-hub] Statistiken nutzen jetzt einen profilbezogenen Attempt-Log (per IndexedDB); Auswertung und „Super-Buchstaben“ basieren pro Spieler auf echten Versuchen.
- [sticker-album] Tabs/Blätter farbig differenziert, Slot-Animationen geglättet (einmaliges Rendern, kürzere Reveal), Duplikate mit eigenem Boink-Sound.
- [trophy] Abschluss spielt parallel einen Trophy-Sound; Geschenk-Lottie-Pfad korrigiert (GiftLotti), Reward-Doppelung beim Sticker-Abholen entfernt.
