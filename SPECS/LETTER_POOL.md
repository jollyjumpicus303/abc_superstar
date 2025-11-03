# LETTER_POOL – Auswahlregeln

## Ziel
Deterministische, testbare Auswahl des nächsten Zielbuchstabens und der Antwortoptionen.

## Regeln
- **Poolquelle:** abhängig vom Modus (nur aufgenommene / alle / Lernweg‑Freischaltung).
- **Keine Direkt‑Wiederholung:** `next !== last`.
- **Recent‑Sperre:** Optionales Fenster `recent` (Größe 2–3) zur Vielfalt.
- **Fehlergewichtung:** `w(letter) = 1 + 2 * wrongCounts[letter]` (max 7).
- **Fehlervorgabe:** Wenn Fehlerliste nicht leer → mindestens jeder 3. Pick aus dieser Liste.
- **Optionengröße:** aus Difficulty (LEICHT=4, MITTEL=4–6, SCHWER=8, PROFI=8 ohne visuelle Hilfe).

## API
- `pickNext({ pool, last, wrongCounts, recent=[] }): string`
- `makeOptions({ correct, pool, size }): string[]`

## Tests
- Kein Direkt‑Repeat.
- Höhere Auswahlrate für häufig falsche Buchstaben.
- `makeOptions` enthält `correct` genau einmal; keine Duplikate.

## Codex‑Prompt
> **Codex:** Erstelle `app/letterPool.(ts|js)` mit `pickNext` und `makeOptions` nach obigen Regeln. Erstelle `tests/letterPool.test.(ts|js)` mit mindestens 10 Tests (Jest oder Vitest), die Wiederholungen, Gewichtung und Optionenerzeugung prüfen.
