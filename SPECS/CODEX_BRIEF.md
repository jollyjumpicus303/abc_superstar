# CODEX_BRIEF – Arbeitsweise

## Ziel
Codex soll die oben verlinkten SPECS schrittweise umsetzen, beginnend mit 6.1 und 6.2.

## Vorgehen für Codex
1. Öffne `SPECS/DATA_MODEL.md` und implementiere `progressStore`.  
2. Öffne `SPECS/LETTER_POOL.md` und implementiere `letterPool` + Tests.  
3. Implementiere `SPECS/PROGRESSION_RULES.md`.  
4. UI gemäß `SPECS/MODE_SELECTION.md` & `SPECS/UX_UI.md`.  
5. Adaptive Practice, SFX, QA‑Checkliste.

## Qualitätskriterien
- Reine Module ohne DOM‑Zugriff für Kernlogik (testbar).  
- Unit‑Tests für Logik (Jest/Vitest).  
- Keine Regressionen: bestehende Spiel‑UI weiter nutzbar.

## Beispiel‑Prompt für Codex (VS Code)
> **Codex:** Lies `SPECS/LETTER_POOL.md` und implementiere `app/letterPool.ts` inkl. `tests/letterPool.test.ts` (Vitest). Stelle sicher, dass kein Zielbuchstabe direkt auf sich selbst folgt und dass die Fehlergewichtung die Auswahlwahrscheinlichkeit sichtbar erhöht.

