# Sound Effects (SFX)

## Sound-Dateien
Die Soundeffekte für die App befinden sich im Verzeichnis `app/sfx/`:
- `success.mp3`: Wird bei einer richtigen Antwort abgespielt.
- `fail.mp3`: Wird bei einer falschen Antwort abgespielt.
- `click.mp3`: Dient als akustisches Feedback für Klicks auf Buttons.
- `start.mp3`: Signalisiert den Beginn eines neuen Spiels.
- `unlock.mp3`: Wird abgespielt, wenn neue Buchstaben oder Level freigeschaltet werden.
- `reward.mp3`: Ertönt am Ende einer erfolgreichen Runde als Belohnung.

## Anforderungen
- **Globaler Sound-Toggle:** Ein globaler Ein-/Ausschalter für alle Soundeffekte.
- **Lautstärkeregelung:** Die Lautstärke der einzelnen Sounds wird im Code festgelegt, um eine ausgewogene Klangkulisse zu gewährleisten.
- **Vorladen der Sounds:** Um Latenzen zu vermeiden, werden die Sound-Dateien beim Start der Anwendung vorgeladen und im Speicher gehalten.
- **Browser-Kontext:** Die Wiedergabe von Audio erfordert eine Benutzerinteraktion und wird über die Web Audio API gesteuert, um eine zuverlässige Funktion in modernen Browsern sicherzustellen.

## Codex‑Prompt
> **Codex:** Implementiere ein Modul, das die Soundeffekte über die Web Audio API verwaltet. Stelle sicher, dass die Sounds vorgeladen werden, um eine verzögerungsfreie Wiedergabe zu gewährleisten. Integriere die Sound-Wiedergabe an den entsprechenden Stellen in der Anwendungslogik (z.B. bei Klicks, richtigen/falschen Antworten, Spielstart).