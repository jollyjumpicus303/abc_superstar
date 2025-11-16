# PROGRESSION_RULES – Lernweg (Abenteuer‑Pfad)

## Phasen
- **Start:** 4 Buchstaben (A–D).  
- **Freischaltung:** +4 Buchstaben nach **2 fehlerfreien Läufen** am Stück.  
- **Stufen:** 4 → 8 → 12 → 16 → 20 → 24 → 26.

## Zustandsübergänge
- **Bei Erfolg (0 Fehler):** `flawlessStreak` wird um 1 erhöht.
  - Wenn `flawlessStreak` den Wert `2` erreicht, werden `4` neue Buchstaben freigeschaltet (`unlocked` wird um 4 erhöht, bis maximal 26).
  - `flawlessStreak` wird danach auf `0` zurückgesetzt.
- **Bei Misserfolg (1+ Fehler):** `flawlessStreak` wird auf `0` zurückgesetzt. Bereits freigeschaltete Buchstaben bleiben erhalten.

## Codex‑Prompt
> **Codex:** Implementiere ein Modul `app/progression.(ts|js)` mit einer Funktion `advanceAfterRun({result, state}) → newState`, das gemäss den obigen Regeln die Zustandsvariablen `unlocked` und `flawlessStreak` aktualisiert. Schreibe Unit-Tests, um Erfolgs- und Fehlerserien zu überprüfen.
