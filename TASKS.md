# ABC-Abenteuer – Feature-Roadmap

Priorisierte Taskliste für die Weiterentwicklung der ABC-Lern-App.

## Status-Legende
- ⬜ Noch nicht begonnen
- 🔄 In Arbeit
- ✅ Abgeschlossen

---

## 1. PWA/Offline-App verbessern ✅

**Priorität:** Hoch | **Aufwand:** Niedrig | **Status:** Abgeschlossen

### Ziele:
- Service Worker testen und optimieren
- Installierbarkeit auf Tablet/Smartphone sicherstellen
- Offline-Funktionalität vollständig gewährleisten

### Aufgaben:
- [x] Service Worker auf Vollständigkeit prüfen
- [x] Install-Prompt implementieren (Custom Button im Header)
- [x] Alle Assets für Offline-Nutzung cachen
- [x] Cache-Version v3, activate-Listener für Cleanup
- [x] Manifest optimiert (scope, orientation, categories, lang)

### Hinweis:
Custom Install-Button erscheint noch nicht auf Android Chrome/Brave. App ist aber über Browser-Menü installierbar ("App installieren" / "Zum Startbildschirm"). Vermutlich werden PNG-Icons benötigt (siehe Task #12).

---

## 1a. UX für fehlende Aufnahmen verbessern ✅

**Priorität:** Hoch | **Aufwand:** Niedrig | **Status:** Abgeschlossen

### Ziele:
- Benutzer erkennt sofort dass Aufnahmen fehlen
- Benutzerführung zum ersten Schritt (Aufnahmen machen)
- Buttons intelligent aktivieren/deaktivieren

### Umgesetzte Verbesserungen:
- [x] Info-Box im Spiel-Tab wenn keine Aufnahmen vorhanden
- [x] Button "Spiel starten" wird disabled ohne Aufnahmen
- [x] "Jetzt Aufnahmen machen" Button führt zu Einstellungen
- [x] Fortschrittsanzeige "X von 26 Buchstaben" prominent in Einstellungen
- [x] Beim ersten Besuch automatisch zu Einstellungen-Tab wechseln
- [x] Dynamisches Update nach jeder Aufnahme/Löschen

---

## 2. Export/Import-Funktion für Aufnahmen ✅

**Priorität:** Hoch | **Aufwand:** Mittel | **Status:** Abgeschlossen

### Ziele:
- Eltern können Aufnahmen auf andere Geräte übertragen
- Backup-Möglichkeit für Aufnahmen

### Aufgaben:
- [x] Export-Funktion: Alle Aufnahmen als ZIP herunterladen
- [x] Import-Funktion: ZIP hochladen und in IndexedDB speichern
- [x] UI für Export/Import in Einstellungen hinzufügen
- [x] Validierung der importierten Daten

### Implementierung:
- **Export:** Alle Aufnahmen werden als ZIP-Datei heruntergeladen (Dateiname: `abc-abenteuer-aufnahmen-YYYY-MM-DD.zip`)
- **Import:** ZIP-Datei hochladen, automatische Validierung (nur Audio-Dateien A-Z.webm/ogg/mp4/etc.)
- **Buttons:** "📦 Exportieren" und "📥 Importieren" in Einstellungen
- **Validierung:** Überspringt ungültige Dateien (falsche Namen, keine Audio-Dateien, System-Dateien)

---

## 3. Design kindlicher/verspielter gestalten ⬜

**Priorität:** Mittel | **Aufwand:** Mittel

### Ziele:
- App ansprechender für Kinder gestalten
- Spielerische Elemente hinzufügen

### Aufgaben:
- [ ] Farbschema überarbeiten (kräftigere, freundlichere Farben)
- [ ] Größere, kindgerechte Buttons
- [ ] Animationen für Buchstaben hinzufügen
- [ ] Lustige Soundeffekte für richtige/falsche Antworten
- [ ] Fröhliche Illustrationen/Icons integrieren

---

## 4. Aufnahme-Assistent ⬜

**Priorität:** Mittel | **Aufwand:** Hoch

### Ziele:
- Aufnahme-Prozess vereinfachen
- Qualität der Aufnahmen verbessern

### Aufgaben:
- [ ] Batch-Recording: Alle 26 Buchstaben nacheinander aufnehmen
- [ ] Auto-Trimming: Stille am Anfang/Ende automatisch entfernen
- [ ] Pegel-Anzeige: Visuelles Feedback während Aufnahme
- [ ] Playback-Funktion vor dem Speichern
- [ ] "Neu aufnehmen"-Option falls unzufrieden

---

## 5. Sticker-Album & Belohnungssystem ⬜

**Priorität:** Mittel | **Aufwand:** Hoch

### Ziele:
- Motivation durch Sammelmechanik erhöhen
- Langfristige Bindung schaffen

### Aufgaben:
- [ ] Sticker-Sammelsystem: Pro richtig erkanntem Buchstaben Sticker
- [ ] Album-Ansicht zum Durchblättern
- [ ] Verschiedene Sticker-Sets (Tiere, Fahrzeuge, etc.)
- [ ] "Glitzer-Effekt" beim Erhalt neuer Sticker
- [ ] Fortschrittsbalken im Album

---

## 6. Modus-Auswahl ⬜

**Priorität:** Niedrig | **Aufwand:** Mittel

### Ziele:
- Flexibilität für verschiedene Lernstufen
- Anpassung an individuellen Fortschritt

### Aufgaben:
- [ ] Modus "Nur aufgenommene Buchstaben"
- [ ] Modus "Alle Buchstaben"
- [ ] "Lernweg"-Modus: Schrittweise Einführung neuer Buchstaben
- [ ] Schwierigkeitsgrad-Anpassung (größere/kleinere Auswahl)
- [ ] Einstellungs-UI für Modi

---

## 7. Zweites Spiel: Buchstaben-Suche ⬜

**Priorität:** Niedrig | **Aufwand:** Mittel

### Ziele:
- Abwechslung durch zweites Spielprinzip
- Großbuchstaben & Kleinbuchstaben üben

### Aufgaben:
- [ ] Neues Spiel: Audio abspielen, richtigen Buchstaben aus 4-6 finden
- [ ] Groß-/Kleinbuchstaben-Option
- [ ] Verschiedene Schriftarten zur Auswahl
- [ ] Navigation zwischen Spielen

---

## 8. Zweites Spiel: Laut-Anfangszuordnung ⬜

**Priorität:** Niedrig | **Aufwand:** Hoch

### Ziele:
- Phonetisches Verständnis fördern
- Zusammenhang Laut → Buchstabe trainieren

### Aufgaben:
- [ ] Bild-Datenbank mit Objekten (Apfel, Ball, etc.)
- [ ] Audio für Objektnamen aufnehmen/einbinden
- [ ] Spiel: Objekt zeigen → Anfangsbuchstaben zuordnen
- [ ] Bilder in verschiedenen Kategorien (Tiere, Essen, Spielzeug)

---

## 9. Barrierefreiheit ⬜

**Priorität:** Niedrig | **Aufwand:** Niedrig

### Ziele:
- App für verschiedene Bedürfnisse anpassen
- Inklusivität erhöhen

### Aufgaben:
- [ ] Option für extra große Buchstaben
- [ ] Hochkontrast-Modus
- [ ] Option "Animationen reduzieren"
- [ ] Screen Reader-Unterstützung
- [ ] Tastatur-Navigation

---

## 10. Eltern-Statistik ⬜

**Priorität:** Niedrig | **Aufwand:** Mittel

### Ziele:
- Eltern Einblick in Lernfortschritt geben
- Schwachstellen identifizieren

### Aufgaben:
- [ ] Tracking: Welche Buchstaben richtig/falsch erkannt
- [ ] Verlaufskurve über Zeit
- [ ] Übersicht "Leichte Buchstaben" vs "Schwierige Buchstaben"
- [ ] Export der Statistik als PDF/CSV
- [ ] Passwortschutz für Statistik-Bereich

---

## 11. PNG-Icons für PWA erstellen ⬜

**Priorität:** Niedrig | **Aufwand:** Niedrig

### Problem:
Das `beforeinstallprompt`-Event wird auf Android Chrome/Brave nicht gefeuert. Vermutlich akzeptieren die Browser nur PNG-Icons (nicht SVG) für PWA-Installierbarkeit.

### Ziele:
- Custom Install-Button im Header soll auch auf Android erscheinen
- Bessere Browser-Kompatibilität für PWA-Installation

### Aufgaben:
- [ ] PNG-Icon in 192x192 erstellen
- [ ] PNG-Icon in 512x512 erstellen
- [ ] Icons im Manifest referenzieren
- [ ] Auf Android testen

### Workaround (aktuell):
App ist über Browser-Menü installierbar: Chrome-Menü (⋮) → "App installieren"

---

## Deployment-Status

✅ **GitHub Pages:** https://jollyjumpicus303.github.io/abc_superstar/
✅ **HTTPS:** Aktiviert (Mikrofonzugriff funktioniert)
✅ **Repository:** https://github.com/jollyjumpicus303/abc_superstar

---

## Notizen

- App ist aktuell live und funktionsfähig
- Mikrofonzugriff funktioniert auf mobilen Geräten
- IndexedDB speichert Aufnahmen lokal
- Service Worker für Offline-Nutzung bereits vorhanden
