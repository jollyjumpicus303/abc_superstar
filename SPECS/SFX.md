# SFX – Soundeffekte

## Dateien
- `sounds/correct.mp3`, `sounds/wrong.mp3`, `sounds/win.mp3`, `sounds/click.mp3`, `sounds/record_start.mp3`, `sounds/record_stop.mp3`

## Anforderungen
- Globaler Sound‑Toggle & Lautstärkeregler (persistiert).  
- Vorladen beim Start; keine spürbare Latenz.  
- Respektiere „Stumm“ des Geräts (falls möglich im Browser‑Rahmen).

## Codex‑Prompt
> **Codex:** Integriere einen Lautstärke‑Slider (0–1) und einen Mute‑Toggle in den Einstellungen. Lade die MP3s vor und nutze sie in den Erfolg/Fehler‑Callbacks.