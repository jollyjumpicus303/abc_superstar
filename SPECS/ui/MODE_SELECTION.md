
# Mode Selection – Moduswahl & Freier Modus

## Modi
- **LERNWEG:** Automatische Steigerung der Schwierigkeit gemäss den [Fortschrittsregeln](../game-logic/PROGRESSION_RULES.md).
- **FREI:** Manuelle Auswahl der Buchstabenmenge und der Schwierigkeitsstufe.

## UI‑Anforderungen
- Ein Umschalter in den Einstellungen ermöglicht die Wahl zwischen den Modi "FREI" und "LERNWEG".
- Im "FREI"-Modus können die Nutzer die Anzahl der Buchstaben (z.B. 4, 8, 12, 26) und die Schwierigkeit (`LEICHT`, `MITTEL`, `SCHWER`, `AFFIG`) selbst bestimmen.
- Wenn für die gewählte Konfiguration nicht genügend Audio-Aufnahmen vorhanden sind, wird eine Warnung angezeigt und das Starten des Spiels blockiert.

## Codex‑Prompt
> **Codex:** Erweitere die Einstellungs-UI um eine Modus-Auswahl mit den oben genannten Steuerelementen. Die Auswahl soll über den `progressStore` gespeichert werden. Wenn für die gewählte Buchstabenmenge nicht alle Aufnahmen vorhanden sind, zeige einen deutlichen Hinweis mit einem Button, der direkt zur Aufnahme-Funktion führt.
