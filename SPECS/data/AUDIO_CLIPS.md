# AUDIO_SETS – Varianten & Schwierigkeit

## Ziel
Mehrere Aufnahmen pro Buchstabe mit Schwierigkeits-Tags verwalten und beim
Abspielen zur passenden Lernstufe zufällig auswählen.

## Datenmodell (IndexedDB)
- `set-{setId}` hält neben Metadaten drei Audio-Sammlungen:
  - `clips`: reguläre Buchstabenaufnahmen `{ id, letter, difficulty, created }`.
  - `motivationClips`: globale Motivationssounds `{ id, created }`.
  - `medalSounds`: Objekt mit den Schlüsseln `gold`, `silver`, `bronze`; jeder
    Eintrag ist eine Liste `{ id, created }` für beliebig viele Clips pro Rang.
- `difficulty` nutzt dieselben Werte wie der Spielmodus: `LEICHT`, `MITTEL`,
  `SCHWER`, `AFFIG` (Standard: `LEICHT`).
- Audiodaten liegen als Blobs in separaten Keys:
  - `audio-{setId}-{clipId}` für Buchstaben.
  - `motivation-{setId}-{clipId}` für Motivationssounds.
  - `medal-{setId}-{clipId}` für Medaillenjubel.
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
- Motivationssounds werden separat über `motivationClips` rotiert; die Auswahl
  hängt nur daran, ob der Buchstabe zuvor falsch war.
- Medaillen-Sounds werden pro Rang aus der jeweiligen Liste gezogen; fehlt ein
  Clip, greift die App auf den Standard-SFX zurück.

## Migration
- Bestehende Einzel-Aufnahmen werden zu Clips mit `difficulty = LEICHT`
  migriert (ein Clip pro Buchstaben).
- Für Sets ohne Clips wird beim ersten Zugriff eine Migration ausgelöst.
- Beim Einführen von `motivationClips`/`medalSounds` erhalten bestehende Sets
  leere Arrays/Maps, sodass neue Uploads sofort gespeichert werden können.

## Import/Export
- ZIP-Dateien enthalten pro Set neben den Buchstabenordnern zwei weitere
  Ordner:
  - `motivation/clipId.ext` für Motivation.
  - `medals/{gold|silver|bronze}-clipId.ext` für Jubel.
- `sets.json` führt entsprechende Listen (`motivationClips`, `medals.gold[]`
  etc.) mit `id`, optionalem `file` und Zeitstempel.
- Beim Import können sowohl mehrere Dateien je Rang als auch reine
  Aufnahme-Sets ohne Extras verarbeitet werden.

## Codex-Prompt
> **Codex:** Erweitere das Set-Management so, dass Aufnahmen als Clips mit
> Schwierigkeits-Tag gespeichert werden. Aktualisiere Aufnahme- und
> Wiedergabe-Flow entsprechend `pickClip`. Baue eine Migration für bestehende
> Aufnahmen ein.
