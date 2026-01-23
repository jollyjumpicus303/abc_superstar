# PROGRESSION_RULES – Lernweg (Abenteuer‑Pfad)

## Phasen
- **Start:** 4 Buchstaben (A–D).  
- **Freischaltung:** +4 Buchstaben nach **2 fehlerfreien Läufen** am Stück.  
- **Stufen:** 4 → 8 → 12 → 16 → 20 → 24 → 26.
- **Phase 2:** Nach 26 Grossbuchstaben wechselt der Lernweg zu Kleinbuchstaben und startet wieder bei 4 (gleiche Stufenlogik).
- **Phase 3:** Nach 26 Kleinbuchstaben wechselt der Lernweg zu gemischten Buchstaben (Gross/Klein zufaellig pro Buchstabe, Reihenfolge gemischt). Jeder Buchstabe kommt genau einmal vor (entweder gross oder klein). Start wieder bei 4.
- **Rundenanzahl:** Zielrunden = `clamp(8..20, 6 + ceil(unlocked/2))`; der Runden-Slider bleibt Mindestwert.

## Zustandsübergänge
- **Bei Erfolg (0 Fehler):** `flawlessStreak` wird um 1 erhöht.
  - Wenn `flawlessStreak` den Wert `2` erreicht, werden `4` neue Buchstaben freigeschaltet (`unlocked` wird um 4 erhöht, bis maximal 26).
  - Wenn `unlocked` bei 26 steht und der erste Buchstabensatz abgeschlossen ist, wechselt der Lernweg zu Kleinbuchstaben und setzt `unlocked` auf 4.
  - Wenn `unlocked` bei 26 steht und der zweite Buchstabensatz abgeschlossen ist, wechselt der Lernweg zu gemischten Buchstaben und setzt `unlocked` auf 4.
  - `flawlessStreak` wird danach auf `0` zurückgesetzt.
- **Bei Misserfolg (1+ Fehler):** `flawlessStreak` wird auf `0` zurückgesetzt. Bereits freigeschaltete Buchstaben bleiben erhalten.

## Codex‑Prompt
> **Codex:** Implementiere ein Modul `app/progression.(ts|js)` mit einer Funktion `advanceAfterRun({result, state}) → newState`, das gemäss den obigen Regeln die Zustandsvariablen `unlocked` und `flawlessStreak` aktualisiert. Schreibe Unit-Tests, um Erfolgs- und Fehlerserien zu überprüfen.
