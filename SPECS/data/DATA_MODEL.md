# DATA_MODEL – Persistenz & Struktur

## Ziel
Einheitliches Datenmodell für die Speicherung des Spielmodus, des Lernfortschritts und der Benutzereinstellungen.

## State-Schema
Das folgende JSON-Schema repräsentiert den Zustand, der im `localStorage` gespeichert wird:
```json
{
  "version": 1,
  "mode": "FREI",
  "unlocked": 4,
  "flawlessStreak": 0,
  "wrongCounts": {},
  "difficulty": "LEICHT",
  "freeLetterCount": 4
}
```

- **`version`**: Die Version des Datenmodells, um zukünftige Migrationen zu ermöglichen.
- **`mode`**: Der aktive Spielmodus (`'FREI'` oder `'LERNWEG'`).
- **`unlocked`**: Die Anzahl der freigeschalteten Buchstaben im `'LERNWEG'`-Modus.
- **`flawlessStreak`**: Zählt die Anzahl der aufeinanderfolgenden fehlerfreien Runden im `'LERNWEG'`-Modus.
- **`wrongCounts`**: Ein Objekt, das die Fehler pro Buchstabe zählt (z.B. `{ "B": 3, "D": 1 }`).
- **`difficulty`**: Die globale Schwierigkeitsstufe (`'LEICHT'`, `'MITTEL'`, `'SCHWER'`, `'AFFIG'`).
- **`freeLetterCount`**: Die Anzahl der Buchstaben, die im `'FREI'`-Modus verwendet werden.

## Anforderungen
Das `progressStore`-Modul soll folgende Funktionalitäten bereitstellen:
- **`getProgress()`**: Liest den aktuellen Zustand aus dem `localStorage`.
- **`saveProgress(updates)`**: Aktualisiert den Zustand mit den übergebenen Änderungen und speichert ihn.
- **`resetProgress()`**: Setzt den Zustand auf die Standardwerte zurück.
- **`markCorrect(letter)`**: Verringert die Fehlerzahl für einen Buchstaben.
- **`markWrong(target, chosen)`**: Erhöht die Fehlerzahl für einen Buchstaben und protokolliert die Verwechslung.
- **Migrationslogik**: Eine interne `migrate`-Funktion soll bei Bedarf alte Datenmodelle auf die aktuelle Version aktualisieren.

## Codex‑Prompt
> **Codex:** Lege ein Modul `app/progressStore.(ts|js)` an, das das oben beschriebene Schema im `localStorage` verwaltet. Exportiere die Methoden `getProgress`, `saveProgress`, `resetProgress`, `markCorrect` und `markWrong`. Implementiere eine `migrate(state)`-Funktion, die eine Aktualisierung von einer früheren Version auf `version: 1` durchführt.
