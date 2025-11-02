# AUDIO_SETS – Varianten & Schwierigkeit

## Ziel
Mehrere Aufnahmen pro Buchstabe mit Schwierigkeits-Tags verwalten und beim
Abspielen zur passenden Lernstufe zufällig auswählen.

## Datenmodell (IndexedDB)
- `set-{setId}` speichert künftig zusätzlich ein Array `clips`.
- Jeder Eintrag `clip` enthält: `{ id, letter, difficulty, created }`.
- `difficulty` nutzt dieselben Werte wie der Spielmodus: `LEICHT`, `MITTEL`,
  `SCHWER`, `PROFI` (Standard: `LEICHT`).
- Audiodaten selbst werden unter `audio-{setId}-{clipId}` abgelegt.
- Bestehende Felder (`name`, `emoji`, `created`) bleiben unverändert.

## Aufnahme-Flow
- Aufnahme-UI erlaubt die Wahl der Schwierigkeit vor dem Start.
- Beim Speichern wird ein neuer `clip` angelegt (UUID für `id`).
- Mehrere Clips für denselben Buchstaben und dieselbe Schwierigkeit sind
  erlaubt; Löschen bezieht sich auf einzelne Clips.

## Wiedergabe
- `pickClip({ setId, letter, difficulty })` filtert alle Clips des Buchstabens
  mit passender Schwierigkeit und wählt zufällig (gleichverteilte Auswahl).
- Fallback, falls keine Clips vorhanden: gleiche Buchstabe, nächstniedrigere
  Schwierigkeit → ansonsten Standard (`LEICHT`) → Fehlermeldung.
- Rückgabe liefert `clipId`, um den passenden Blob `audio-{setId}-{clipId}` zu
  laden.

## Migration
- Bestehende Einzel-Aufnahmen werden zu Clips mit `difficulty = LEICHT`
  migriert (ein Clip pro Buchstaben).
- Für Sets ohne Clips wird beim ersten Zugriff eine Migration ausgelöst.

## Codex-Prompt
> **Codex:** Erweitere das Set-Management so, dass Aufnahmen als Clips mit
> Schwierigkeits-Tag gespeichert werden. Aktualisiere Aufnahme- und
> Wiedergabe-Flow entsprechend `pickClip`. Baue eine Migration für bestehende
> Aufnahmen ein.
