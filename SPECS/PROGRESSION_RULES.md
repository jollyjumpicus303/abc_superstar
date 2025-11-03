# PROGRESSION_RULES – Lernweg (Abenteuer‑Pfad)

## Phasen
- **Start:** 4 Buchstaben (A–D).  
- **Freischaltung:** +4 nach **2 fehlerfreien Läufen** am Stück.  
- Stufen: 4 → 8 → 12 → 16 → 20 → 26.
- **Audio‑Set‑Wechsel:** Nach **2 erfolgreichen Läufen** mit 26 Buchstaben und Set **ANLAUT** → Wechsel auf **OHNE_ANLAUT**.
- **Nach 26 (Set OHNE_ANLAUT):** Runden starten mit 4 Buchstaben, nach Erfolg +4 (4→8→…→26).

## Zustandsübergänge
- Bei Erfolg: `flawlessStreak += 1`; wenn `flawlessStreak === 2` → `unlocked += 4` (max 26), `flawlessStreak = 0`.
- Bei Misserfolg: `flawlessStreak = 0` (Freischaltungen bleiben erhalten).

## Codex‑Prompt
> **Codex:** Implementiere ein Modul `app/progression.(ts|js)` mit `advanceAfterRun({result, state}) → newState`, das gemäß obigen Regeln `unlocked`, `flawlessStreak` und `audioSet` aktualisiert. Schreibe Unit‑Tests für Erfolgs- und Fehlerserien sowie Set‑Wechsel.
