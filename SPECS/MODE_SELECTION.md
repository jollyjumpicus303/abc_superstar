
# MODE_SELECTION – Moduswahl & Freier Modus

## Modi
- **LERNWEG:** automatische Steigerung gemäß `PROGRESSION_RULES`.
- **FREI:** manuelle Wahl von Buchstabenmenge, Audio‑Set, Schwierigkeit.

## UI‑Anforderungen
- Umschalter „Modus“ (FREI/LERNWEG).  
- Falls FREI: Controls für Menge (4/8/12/26), Set (ANLAUT/OHNE_ANLAUT), Difficulty (LEICHT/MITTEL/SCHWER/PROFI).  
- Warnung/Sperre, wenn Aufnahmen fehlen.

## Codex‑Prompt
> **Codex:** Erweitere die Einstellungen‑UI um eine Moduskarte mit den o. g. Controls. Persistiere die Auswahl über `progressStore`. Wenn für „Alle Buchstaben“ nicht alle Aufnahmen vorhanden sind, zeige einen Hinweis mit Button „Jetzt aufnehmen“.
