# DATA_MODEL – Persistenz & Struktur

## Ziel
Einheitliches Datenmodell für Modus, Fortschritt, Fehler & Audio‑Set.

## State-Schema
```json
{
  "version": 1,
  "mode": "FREI",
  "unlocked": 4,
  "flawlessStreak": 0,
  "wrongCounts": {},
  "audioSet": "ANLAUT",
  "difficulty": "LEICHT"
}
```

## Audio-Set-Metadaten
- Aufnahmen werden in IndexedDB als Clips mit Schwierigkeits-Tag verwaltet
  (Details siehe `SPECS/AUDIO_SETS.md`).
- `progressStore` speichert nur die Auswahl (`audioSet`, `difficulty`), nicht
  die einzelnen Clips.

## Anforderungen
- `getProgress()`, `saveProgress()`, `resetProgress()`
- `markCorrect(letter)` → Fehlergewicht abbauen (Decay nach 2 korrekten Treffern)
- `markWrong(letter[])` → Fehlergewicht erhöhen
- Migrationslogik über `version`

## Codex‑Prompt
> **Codex:** Lege ein Modul `app/progressStore.(ts|js)` an, das obiges Schema in `localStorage` verwaltet. Exportiere die oben genannten Methoden. Implementiere eine einfache `migrate(state)`‑Funktion von `version < 1` auf `1`.
