# ABC-Abenteuer – Feature-Roadmap

Priorisierte Taskliste für die Weiterentwicklung der ABC-Lern-App.

## Status-Legende
- ⬜ Noch nicht begonnen
- 🔄 In Arbeit
- ✅ Abgeschlossen

---

## Code Cleanup

**Priorität:** Mittel | **Aufwand:** Niedrig

### Ziele:
- Vereinfachung der Codebasis durch Entfernung von ungenutztem Code.
- Verbesserung der Wartbarkeit und Übersichtlichkeit.

### Aufgaben:
- [ ] **Ungenutzte `makeOptions`-Funktion entfernen:** Die Funktion `makeOptions` in `app/letterPool.js` ist obsolet und wird nicht mehr verwendet. Sie sollte entfernt werden, um den Code zu vereinfachen.
- [ ] **`audioSet`-Logik entfernen:** Das Konzept der `audioSet`s zum Wechseln zwischen verschiedenen Audio-Dateien ist veraltet und wird in der Hauptanwendungslogik nicht mehr genutzt. Die entsprechende Logik sollte aus `app/progression.js` und `app/progressStore.js` entfernt werden.

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

## 7. Kids-Centered Game Experience ⬜

**Priorität:** Hoch | **Aufwand:** Hoch

### Ziele:
- Gameplay für 5–8-Jährige verständlicher machen
- Belohnungssystem visuell & auditiv stärker inszenieren
- Navigation auf ikonische, kindgerechte Elemente umstellen

### Aufgaben:
- [x] **Aufgabe 7.1 – Sterne-/Belohnungsanzeige überarbeiten**  
  *Beschreibung:* Sterne wandern vom HUD in den Ergebnisdialog (Canvas-Reveal + 0–5-Skala) und der Fortschritt bis zum nächsten Sticker-Pack wird als rundes Star-Widget im Album gezeigt (siehe `SPECS/ui/KIDS_GAMEPLAY_IMPROVEMENTS.md`). Die Geschenkbox/Pack-Animation folgt separat.  
  *Was du lieferst:* Canvas-/SFX-Vorlage (`spec_canvas…`, `GiftSound.mp3`, `GiftLotti.json`) sowie Styling-Referenzen für die abgerundeten Album-Sterne.  
  *Was ich umsetze:* Canvas-Integration, Sternberechnung & Persistenz, Audio-Hooks und das Album-Widget (ohne Geschenkbox).
- [x] **Aufgabe 7.1b – Einzelbuchstaben-Upload**  
  *Beschreibung:* Upload-Dialog pro Buchstabe (oder mehrerer Dateien gleichzeitig), um einzelne Clips schnell auszutauschen (siehe `SPECS/ui/SINGLE_CLIP_UPLOAD.md`).  
  *Lieferung:* Keine zusätzlichen Assets nötig – nur MP3/OGG-Dateien.  
  *Umsetzung durch mich:* UI-Menü im Status-Grid, Upload-Modal mit Difficulty-Wahl, `importSingleClips`-Utility inkl. Feedback & Tests.
- [ ] **Aufgabe 7.2 – Icon-basierte Navigation & Maskottchen-Hinweise**  
  *Beschreibung:* Tabs/Navigation durch große Icons ersetzen, kontextuelle Hinweise (Sprechblasen + optionale TTS) einbauen, inkl. „Zurück zum Abenteuer“-Callouts (`SPECS/ui/KIDS_GAMEPLAY_IMPROVEMENTS.md`).  
  *Was du lieferst:* Icon-Set für Tabs (SVG/PNG) + Maskottchen/Grafiken (PNG/SVG) + TTS-Audios pro Hinweis (MP3).  
  *Was ich umsetze:* Neue Tab-Leiste, Fokus-/Hover-States, Einbindung der Hinweistexte und optionaler Audio-Playback.
- [ ] **Aufgabe 7.3 – Stickerbuch & Drag-and-Drop-Spielplatz**  
  *Beschreibung:* Sticker-Album als buchstäbliche Seiten mit freien Slots, Drag-&-Drop zum Umplatzieren, hervorhobene neue Sticker (`SPECS/ui/KIDS_GAMEPLAY_IMPROVEMENTS.md`).  
  *Was du lieferst:* Stickerbuch-Hintergründe/Slots (PNG/SVG) + Sticker-Grafiken (PNG/SVG).  
  *Was ich umsetze:* Neues UI-Layout, DnD-Logik, Fortschrittsvisualisierung.

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

## 7. Eltern-Statistik & Lern-Coach ✅

**Priorität:** Mittel | **Aufwand:** Hoch

### Ziele:
- Eltern einen klaren Einblick in den Lernfortschritt geben.
- Nicht nur Daten liefern, sondern direkt umsetzbare Hilfestellungen und positive Verstärkung bieten.
- Die App zu einem interaktiven "Lern-Coach" für Eltern machen.

### Aufgaben:
- [x] **Erweitertes Tracking:** Jeden Versuch loggen (gesuchter Buchstabe, gewählter Buchstabe, Zeitstempel).
- [x] **Eltern-Bereich erstellen:**
    - [x] Einen neuen Tab "Für Eltern" hinzufügen.
    - [x] Zugang mit einer "Eltern-Sperre" (Parental Gate) schützen (z.B. Rechenaufgabe, Geste), anstatt eines festen Passworts.
- [x] **Statistiken visualisieren:**
    - [x] **"Nächste Herausforderung":** Eine Liste der Buchstaben anzeigen, die am häufigsten falsch waren.
    - [x] **"Super-Buchstaben":** Erfolge feiern, indem gemeisterte Buchstaben hervorgehoben werden.
    - [x] **Typische Verwechslungen:** Aufzeigen, welche Buchstaben oft miteinander verwechselt werden (z.B. "B wird oft mit P verwechselt").
- [x] **Aktion statt nur Daten:**
    - [x] Neben den "Problembuchstaben" einen Button "Übungsrunde starten" anbieten, der ein gezieltes Spiel startet.
- [ ] **(Optional) Lernkurve & Export:**
    - [ ] Verlaufskurve über Zeit anzeigen (z.B. % richtig pro Tag/Woche).
    - [ ] Export der Statistik als einfache CSV-Datei.

---

## 8. UX-Refactoring: Modi & Audio-Steuerung 🔄

**Priorität:** Hoch | **Aufwand:** Mittel

### Ziele:
- Den Einstieg in die App so einfach und direkt wie möglich gestalten.
- Die Komplexität für Kinder reduzieren und die Klarheit für Eltern erhöhen.
- Redundanz und Verwirrung bei den Audio-Einstellungen beseitigen.

### Aufgaben:
- [x] **Modi auf 2 reduzieren:** Die Modus-Auswahl wird auf "Lernweg" und "Individuelles Spiel" vereinfacht.
- [x] **Audio-Steuerung im Spiel:** Während einer laufenden Runde kann die Audio-Art jederzeit über ein Dropdown angepasst werden.
- [x] **Schwierigkeits-Dropdown als einzige Audio-Quelle:** Ein einziges Dropdown steuert die Audio-Art und ersetzt die alte Logik:
    - `Leicht`: Spielt "Buchstabe + Anlaut".
    - `Mittel`: Spielt "Nur Buchstabe".
    - `Schwer`: Spielt das "Beispielwort".
    - `Affig`: Spielt die "Extra-Schwer" / "Profi" Aufnahmen.
- [x] **"Profi" umbenennen:** Die Stufe "Profi" wird durchgängig in "Affig" umbenannt.
- [x] **Redundanz entfernen:** Die separate Auswahl "Mit/Ohne Anlaut" (`audioSet`) wird komplett entfernt.
- [x] **UI anpassen:** Das Modus-Dialogfeld und die Spieleinstellungen entsprechend umbauen.
- [x] **"Individuelles Spiel" erweitern:** Die Konfiguration für das individuelle Spiel wird übersichtlich an einem Ort zusammengefasst (Buchstabenanzahl etc.).

---

## 9. Zweites Spiel: Buchstaben-Suche ⬜

**Priorität:** Niedrig | **Aufwand:** Mittel

### Ziele:
- Abwechslung durch zweites Spielprinzip
- Großbuchstaben & Kleinbuchstaben üben
- Sollte im Lernweg erweitert werden

### Aufgaben:
- [ ] Neues Spiel: Audio abspielen, richtigen Buchstaben aus 4-6 finden
- [ ] Groß-/Kleinbuchstaben-Option
- [ ] Verschiedene Schriftarten zur Auswahl
- [ ] Navigation zwischen Spielen

---

## 10. Zweites Spiel: Laut-Anfangszuordnung ⬜

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

## 11 Aufnahme-Assistent ⬜

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

## 12. Barrierefreiheit ⬜

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

## 13. PNG-Icons für PWA erstellen ⬜

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

## 14. Mehrere Kinderprofile ⬜

**Priorität:** Hoch | **Aufwand:** Hoch

### Ziele:
- Mehrere Kinder können auf demselben Gerät eigene Fortschritte, Sterne und Sticker sammeln.
- Profile lassen sich schnell und kindgerecht auswählen.
- Verwaltung erfolgt ausschließlich durch Erwachsene (Parental Gate).

### Aufgaben:
- [x] Profil-Store implementieren (`profileStore.js`) inkl. CRUD, aktives Profil, Farben/Emoji.
- [x] Migration bestehender Daten in das erste Profil (Progress, Sterne, Sticker, aktive Sets).
- [x] UI für Profilwahl: Header-Badge + Vollbild-Dialog mit Karten, inkl. „Neues Profil“-Flow.
- [x] Eltern-Optionen zum Umbenennen/Löschen unter „Für Eltern“ (geschützt durch Gate).
- [x] Alle relevanten Speicherbereiche profilbezogen machen (Progress, Sterne, Sticker, Statistik, aktive Sets).
- [x] QA: Wechsel zwischen Profilen stoppt laufende Spiele und lädt UI sauber neu.

**Details:** siehe `SPECS/ui/KIDS_PROFILES.md`

---

## 15. Clay-UI Variante (archiviert)

**Status:** Eingestellt. Die Clay-Variante und zugehoerige Doku/Assets wurden entfernt; Classic bleibt allein.

---

## 16. Vereinheitlichtes Eltern-Dashboard ✅

**Priorität:** Hoch | **Aufwand:** Mittel-Hoch

### Ziele:
- Eltern- und Einstellungsbereich in der Classic-UI zu einem geschützten Hub zusammenführen (Single Entry über das Zahnrad).
- Einheitliche Navigation für Profile, Aufnahmen sowie Set- und Sound-Verwaltung; Parental Gate davor.
- Umsetzung gemaess `ProjectData/Requirements/UnifiedParentalDashboard.md`, als Shared-Modul nutzbar.

### Aufgaben:
- [ ] Single Entry Point: Zahnrad führt in den Hub; Parental Gate (Rechenaufgabe) vor Eintritt; erneute Abfrage erst nach Verlassen + 10s Ruhezeit, nicht während laufender Aufnahmen.
- [x] Navigation: Desktop-Sidebar; mobil Bottom-Tabs mit Icons/Text für „Übersicht“, „Aufnahmen“, „Sets & Extras“.
- [x] Übersicht: Profil-Liste mit Bearbeiten/Löschen, Fortschritts-KPIs (Super-Buchstaben/Herausforderungen) über konfigurierbare „letzte X Sessions“, Quick Action „Profil anlegen“.
- [x] Aufnahmen: Buchstabenraster mit Status, Recorder mit Serienaufnahme, Set-Umschalter, Import einzelner Buchstaben (bestehende Flows übernehmen).
- [x] Sets & Extras: Set-CRUD, Belohnungs-/Motivations-Sounds verwalten, Backup-Export/Import (bestehende Flows übernehmen).
- [x] UX/Accessibility: Status-Header (aktives Profil, 0/26 Aufnahmen, letzter Export) + „Weiter“-Empfehlung, Fortschritts-Badges in Sidebar/Tabs, sanftes Onboarding (erstbesuch Tooltips, abschaltbar), Responsive Layout; Spez/Flows in `ProjectData/Requirements/UnifiedParentalDashboard.md` aktualisieren.
- [x] Destruktive Aktionen (Set löschen, Import überschreibt): Bestätigungsdialoge, derzeit ohne Undo.

---

## 17. Randomisierte Avatare ✅

**Priorität:** Mittel | **Aufwand:** Mittel

### Ziele:
- Automatische Emoji-Vergabe bei Profilerstellung (global eindeutiger Vorschlag für Classic).
- Schnelles 🔄‑Reroll ohne Wiederholungen, inkl. Fallback wenn der Pool voll ist.
- Elternbereich: Freitext-Emoji-Eingabe + Randomize-Button; Duplikate nur bei manueller Eingabe.
- Einheitliche Normalisierung/Validierung des Emoji-Pools.

### Aufgaben:
- [x] Gemeinsamen Emoji-Pool auf Basis `Requirements/RandomizedAvatar.md` implementieren (141 Emojis, VS-16 entfernt, Duplikate bereinigt).
- [x] Profil-Create-Flow: Zufälliges, freies Emoji anzeigen; 🔄 schlägt neue freie Emojis vor, merkt bereits gezeigte; Fallback erlaubt Wiedervergabe wenn Pool erschöpft.
- [x] Eltern-Hub: Edit/Create-Dialog mit Eingabefeld (beliebige Emojis erlaubt) und Randomize-Button (freie Vorschläge). Hinweis/Badge „zufällig“ sowie Warnung bei <5 freien Emojis.
- [x] Verhalten bei bestehenden Emojis respektieren (Editing behält alte Emojis; manuelles Setzen darf duplizieren).

---

## 18. Eltern-Hub UX (Aufnahmen & Sets) ✅

**Priorität:** Mittel | **Aufwand:** Niedrig  
**Ziel:** Aufnahme-Tab und Set-Verwaltung zusammenführen, damit Set-Wechsel und Aufnahmen ohne Tab-Wechsel möglich sind; Profil-Statistiken im Überblick per Klick auf Profil durchschalten.

**Aufgaben:**
- [x] Tabs „Aufnahmen“ und „Sets & Extras“ zu einem kombinierten Bereich „Aufnahmen & Sets“ zusammenführen (Set-Auswahl oben, Aufnahmen/Recorder darunter, Extras behalten).
- [x] Profilkarten in der Übersicht klickbar machen, um das aktive Profil zu setzen und Statistiken sofort umzuschalten.

---

## 19. Entwicklermodus / QA-Tools ✅

**Priorität:** Mittel | **Aufwand:** Mittel | **Status:** Abgeschlossen

### Ziele:
- Manuelles Testen von Sternbank, Medaillen, Stickern und Statistiken ohne laufendes Spiel.
- Aktivierung nur lokal/absichtlich; klare Trennung zum Kinder-UI.

### Aufgaben:
- [x] Flag-aktivierbares Dev-Panel im Eltern-Hub (Banner + Hotkey/URL-Flag).
- [x] Sternbank-Steuerung (Setzen/±-Buttons), gratis Sticker-Pack, einzelner Sticker-Drop.
- [x] Medaillen- und Run-Simulation (Intro + Gold/Silber/Bronze, Sterne hinzufügen, Star-Reveal aktualisieren).
- [x] Statistik-Helper (Buchstaben-Stat hochzählen) und Doku/Changelog aktualisieren.

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
