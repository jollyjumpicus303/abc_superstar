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

## 3. Design kindlicher/verspielter gestalten ✅

**Priorität:** Mittel | **Aufwand:** Mittel | **Status:** Abgeschlossen

### Ziele:
- App ansprechender für Kinder gestalten
- Spielerische Elemente hinzufügen

### Aufgaben:
- [x] Farbschema überarbeiten (kräftigere, freundlichere Farben)
- [x] Größere, kindgerechte Buttons
- [x] Animationen für Buchstaben hinzufügen
- [x] Lustige Soundeffekte für richtige/falsche Antworten
- [x] Fröhliche Illustrationen/Icons integrieren

### Implementierung:
- **Farbschema:** Kräftige Lila-Orange-Pink Farbpalette (#7c3aed, #fb923c, #f472b6)
- **Buttons:** 20-30% größer, Gradient-Hintergründe, Hover-Effekte mit translateY
- **Buchstaben:** 42px → größer, Bounce-Animation beim Klick, Hover mit Lift-Effekt
- **Soundeffekte (Web Audio API):**
  - Erfolgs-Sound: Aufsteigender Ton (C5 → G5 → C6)
  - Fehler-Sound: Absteigender sanfter Ton (E4 → B3)
  - Klick-Sound: Kurzer Feedback-Ton (A5)
- **Illustrationen:** Verbesserte Gradienten, Schatten, lebendige Status-Dots mit Glow-Effekt

---

## 5. Sticker-Album & Belohnungssystem ⬜

**Priorität:** Mittel | **Aufwand:** Hoch

### Ziele:
- Motivation durch Sammelmechanik erhöhen
- Langfristige Bindung schaffen

### Aufgaben:
- [X] Sticker-Sammelsystem: Pro richtig erkanntem Buchstaben Sticker
- [X] Album-Ansicht zum Durchblättern
- [X] Verschiedene Sticker-Sets (Tiere, Fahrzeuge, etc.)
- [X] "Glitzer-Effekt" beim Erhalt neuer Sticker
- [x] Fortschrittsbalken im Album

---

### 6. Modus‑Auswahl ✅

**Ziel:** Flexible Lernstufen, klarer Fortschritt, adaptive Wiederholung – ohne Frust  
**Abhängigkeiten:** 6.1 → 6.2 → 6.3 → 6.4/6.5 → 6.6 → 6.7/6.8  
**DoD (Definition of Done):**
- Modi sind in der App umschaltbar (Einstellungen).  
- Fortschritt & Fehlerhistorie werden lokal persistiert.  
- Kein Buchstabe zweimal direkt hintereinander.  
- Falsche Antworten werden später gezielt wiederholt (gewichtete Auswahl).  
- Alle Akzeptanzkriterien der Teilaufgaben erfüllt (siehe verlinkte SPECS).
- Nach Abschluss der UI-Integration (Tasks 6.4–6.6) gemeinsamen Push & UI-Test auf GitHub einplanen.

#### 6.1 Persistenz & Datenmodell (Basis)
**Priorität:** Hoch | **Aufwand:** Klein–Mittel  
**Beschreibung:** Zentrales `progressStore`‑Modul (LocalStorage/IndexedDB) für Lernfortschritt, Fehler, freigeschaltete Buchstaben.  
**Akzeptanzkriterien:**
- [x] `getProgress()`, `saveProgress(p)`, `resetProgress()` vorhanden.  
- [x] `markCorrect(letter)` reduziert Fehlergewicht; `markWrong(letter[])` erhöht es.  
- [x] `version`‑basierte Migration vorhanden.  
**Details:** siehe `SPECS/DATA_MODEL.md`

#### 6.2 LetterPool & Auswahlregeln (Kernlogik)
**Priorität:** Hoch | **Aufwand:** Mittel  
**Beschreibung:** Reines Utility `letterPool` (deterministisch, testbar) zur Auswahl des nächsten Zielbuchstabens und Generieren der Button‑Optionen.  
**Akzeptanzkriterien:**
- [x] `pickNext({pool, last, wrongCounts, recent=[]}) → letter`  
- [x] `makeOptions({correct, pool, size}) → letter[]` (ohne Duplikate)  
- [x] Unit‑Tests: kein Direkt‑Repeat; Fehlergewichtung greift; stabile Verteilung.  
**Details:** siehe `SPECS/LETTER_POOL.md`

#### 6.3 Lernweg‑Modus (Abenteuer‑Pfad)
**Priorität:** Hoch | **Aufwand:** Mittel  
**Beschreibung:** Automatischer Progress: Start mit 4 Buchstaben → nach **2 fehlerfreien Läufen** +4 Buchstaben freischalten → bis 26. Danach: Audio‑Set‑Wechsel & gruppierte Anordnung.  
**Akzeptanzkriterien:**
- [x] `unlocked` & `flawlessStreak` werden korrekt geführt.  
- [x] Nach 2 erfolgreichen Läufen bei 26 Buchstaben (Set **ANLAUT**) → Wechsel zu **OHNE_ANLAUT**.  
- [x] UI‑Feedback „Nächste Stufe freigeschaltet!“.  
**Details:** siehe `SPECS/PROGRESSION_RULES.md`

#### 6.4 Freier Modus (manuelle Wahl)
**Priorität:** Mittel | **Aufwand:** Klein  
**Beschreibung:** Eltern wählen Buchstabenmenge (4/8/12/26), Audio‑Set (ANLAUT/OHNE_ANLAUT) und Schwierigkeit (LEICHT/MITTEL/SCHWER/PROFI).  
**Akzeptanzkriterien:**
- [x] Einstellungen wirken sofort & persistieren.  
- [x] Bei fehlenden Aufnahmen: Hinweis/Degradierung.  
**Details:** siehe `SPECS/MODE_SELECTION.md`

#### 6.5 Fehler‑Wiederholung (Adaptive Übung)
**Priorität:** Mittel | **Aufwand:** Klein–Mittel  
**Beschreibung:** Fehler werden gesammelt und mit höherer Wahrscheinlichkeit erneut abgefragt, anschließend mit „Decay“ wieder abgebaut.  
**Akzeptanzkriterien:**
- [x] Mind. jede 3. Runde ein Pick aus Fehlerliste (falls nicht leer).  
- [x] Decay nach Korrekt‑Serien.  
- [x] Eltern‑Tipp im Report (lokal).  
**Details:** siehe `SPECS/ADAPTIVE_PRACTICE.md`

#### 6.6 Einstellungs‑UI (Modus + Schwierigkeit)
**Priorität:** Mittel | **Aufwand:** Klein  
**Beschreibung:** Umschalter „Modus“ (FREI/LERNWEG), und – falls FREI – Auswahl für Buchstabenmenge/Set/Schwierigkeit.  
**Akzeptanzkriterien:**
- [x] Mobile‑geeignet; klare Labels; aktiver Zustand visuell.  
- [x] Hinweis bei fehlenden Aufnahmen inkl. Direktlink „Jetzt aufnehmen“.  
**Details:** siehe `SPECS/UX_UI.md`

#### 6.7 SFX‑Integration (optional)
**Priorität:** Niedrig | **Aufwand:** Klein  
**Beschreibung:** „Yay!“, „Oops!“, Fanfare; globaler Lautstärke‑Regler & Vorladen.  
**Details:** siehe `SPECS/SFX.md`

#### 6.8 Qualität & Tests
**Priorität:** Mittel | **Aufwand:** Klein  
**Beschreibung:** Unit‑Tests für LetterPool; manuelle Checkliste für Lernweg.  
**Details:** siehe `SPECS/QA_CHECKLIST.md`

#### 6.9 Audio-Varianten nach Schwierigkeit
**Priorität:** Mittel | **Aufwand:** Mittel  
**Beschreibung:** Aufnahme- und Wiedergabe-Flow der Audio-Sets um Varianten mit
Schwierigkeits-Tag erweitern.  
**Akzeptanzkriterien:**
- [x] Aufnahme-UI erlaubt das Setzen eines Schwierigkeits-Tags pro Clip
      (Standard `LEICHT`).  
- [x] Mehrere Clips pro Buchstabe & Schwierigkeit sind möglich und einzeln
      löschbar.  
- [x] Spiel nutzt für die aktive Schwierigkeit einen zufälligen Clip der
      passenden Wertigkeit (Fallback wie in der Spec beschrieben).  
- [x] Aufnahme-Assistent springt nach jedem Clip automatisch zum nächsten
      Buchstaben (semi-automatisches Batch-Recording).  
**Details:** siehe `SPECS/AUDIO_SETS.md`

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

## 8.1. Aufnahme-Assistent ⬜

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
