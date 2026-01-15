# Buchstabenspiel – Audio Generator & Web‑App

Dieses Repo enthält die Web‑App *ABC Abenteuer* und ein CLI, das komplette Audio‑Sets per TTS erzeugt.

Die Web-App liegt in einer UI-Variante (Classic):

- **Classic** - bestehende Oberflaeche, aktuell Standard  
  - Code am Root (`index.html`, `app/` .)  
  - Zusaetzlich gespiegelt unter `apps/classic/` (per Sync-Script, nicht manuell bearbeiten)

---

## Classic Sync

```bash
npm run sync:classic
```

Optional (remove stale files in `apps/classic/`):

```bash
npm run sync:classic:clean
```

## Git Hooks (optional)

```bash
npm run hooks:install
```

## 1. Vorbereitung (CLI & App)

1. **Dependencies installieren**
   ```bash
   npm install
   ```
2. **Konfiguration für TTS anlegen**
   - `generator.config.json` enthält Varianten/Voices und optionale Wort‑Overrides. Eine Vorlage findest du in `generator.config.example.json`.
   - Jeder Eintrag unter `variants` beschreibt eine Stimme samt Provider (`openai` oder `elevenlabs`), Voice‑ID, Modell und optional Stilhinweisen.
   - OpenAI akzeptiert aktuell nur eine feste Liste an Voice‑IDs (z. B. `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `coral`, `verse`, `ballad`, `ash`, `sage`, `marin`, `cedar`). Bitte nur diese Werte bei `voice` verwenden.
   - Über `defaultSpeechSpeed` (nur OpenAI) lässt sich das Standard‑Tempo, z. B. `0.8`, global bremsen. `letterPronunciations` akzeptiert Strings oder Objekte mit `text` + optional `ssml` (z. B. `<phoneme alphabet="ipa" ph="eː">E</phoneme>`), sogar Provider‑spezifisch (`providers.openai`). Mit `useSsml: true` pro Variante wird der Text automatisch in `<speak>…</speak>` eingebettet und `{{LETTER}}` nutzt die SSML‑Lautschrift.
3. **API‑Keys setzen**
   - `cp .env.example .env`
   - In `.env` `OPENAI_API_KEY` und/oder `ELEVENLABS_API_KEY` eintragen. Die CLI lädt diese Werte automatisch via `dotenv`.

---

## 2. Web‑App & UI‑Doku

### App starten

Standard‑Variante (Classic):

```bash
npm start
```

anschließend im Browser:

- `http://localhost:8080/index.html` → Classic‑UI

### UI‑Anforderungen & Spezifikation

- Technische Spezifikation & Architektur: `ProjectData/SPECS/README.md`
- Produktanforderungen: `ProjectData/Requirements/`

### Entwicklermodus (lokal)

- Flag/Hotkey: `?devtools=1` (oder `?debug=1`) bzw. `Ctrl+Shift+D` aktiviert einen lokalen Entwicklermodus (Flag `abc_abenteuer_devtools` in `localStorage`).
- Ort: Eltern‑Hub → Tab „Übersicht“ zeigt Banner + Panel „Entwickler‑Tools“ (nur wenn Flag aktiv).
- Funktionen: Sternbank setzen/auffüllen, gratis Sticker‑Pack, Medaillen‑Jubel (Gold/Silber/Bronze, inkl. Custom‑Clips), Run‑Simulation mit Sternen, Buchstaben‑Statistik hochzählen, Einzel‑Sticker vergeben.
- Details: `ProjectData/Requirements/DeveloperMode.md`, `ProjectData/SPECS/ui/DEVTOOLS_MODE.md`.

---

## 3. Audio erzeugen (CLI)

Das Hauptskript heißt `generateLetters`. Mit dem `--`‑Trenner erhält es alle Parameter (auch unter PowerShell).

### Basisbeispiele

- **Dry‑Run / Vorschau ohne API‑Calls**
  ```bash
  npm run generate:letters -- --variants eleven_playful --letters A,B --difficulties LEICHT --dry-run --log-text
  ```
- **Komplette Sätze für alle Buchstaben + vier Schwierigkeitsgrade**
  ```bash
  npm run generate:letters -- \
    --variants eleven_playful,eleven_storytime,eleven_teacher \
    --difficulties LEICHT,MITTEL,SCHWER,AFFIG \
    --out dist/letters-eleven.zip
  ```

### Nützliche Flags

- `--letters A,B,C` oder mit Range `--letters A-M` (inkl. Rückwärts `M-A`). Standard ist A–Z.
- `--difficulties` wählt einen Teil der Schwierigkeitsstufen.
- `--group-by-variant` erzeugt pro Variante ein eigenes Set innerhalb des ZIPs.
- `--use-ssml` aktiviert SSML für Ad-hoc-Varianten (falls der Provider es unterstützt, z. B. OpenAI).
- `--set-name`, `--emoji`, `--format`, `--concurrency`, `--max` usw. siehe `npm run generate:letters -- --help`.
- Ohne `--variants` wird die erste Variante aus `generator.config.json` verwendet. Alternativ kann man Ad‑hoc arbeiten: `--provider elevenlabs --voice <VOICE_ID>`.
- `--split-variants-out dist/by-variant` erzeugt nach dem Lauf automatisch je Stimme ein separates ZIP; optional `--split-variants-base-name`, `--split-variants-emoji`, `--split-variants-overwrite`.

### Lauf in Portionen
Falls ElevenLabs/OpenAI lange Läufe abbricht, kannst du die Buchstaben splitten, z. B.:
```bash
npm run generate:letters -- --letters A-M --variants eleven_playful,eleven_storytime --out dist/part1.zip
npm run generate:letters -- --letters N-Z --variants eleven_playful,eleven_storytime --out dist/part2.zip
```

---

## 4. Varianten trennen

Wenn du noch während des Generierens einzelne ZIPs pro Stimme brauchst, nutze `--split-variants-out ...`. Alternativ steht weiterhin das Skript `splitVariantSets` bereit, um bestehende ZIPs aufzuteilen.

```bash
npm run split:variants -- \
  --inputs dist/part1.zip,dist/part2.zip \
  --out-dir dist/by-variant
```

- Die Variante wird anhand des Dateinamens `A-<variant>-<difficulty>-<id>.mp3` erkannt.
- Für jede gefundene Stimme entsteht im `out-dir` ein ZIP mit eigenem `sets.json`. Diese Dateien lassen sich direkt in der App importieren.
- Mit `--overwrite` werden vorhandene Dateien im Zielordner ersetzt.

---

## 5. Import in die App

1. App starten (z. B. `npm start` → http://localhost:8080).
2. In der UI auf **Importieren** klicken und das erzeugte ZIP auswählen.
3. Die App legt pro ZIP ein Set an; bei den Voice‑ZIPs aus `split:variants` also eines je Stimme.

---

## 6. Troubleshooting

- **HTTP 400/401/429** → stammen vom TTS‑Anbieter. Meist Voice‑ID, Berechtigung oder Quota prüfen.
- **Abbruch in der Mitte** → erneut laufen lassen (ggf. Buchstabenbereich einschränken) und danach `split:variants` nutzen.
- **Texte anpassen** → `scripts/lib/contentLibrary.js` für Wortlisten/Templates, Overrides per `generator.config.json` → `contentOverrides`. `{{LETTER}}` wird automatisch mit Lautschrift ersetzt (inkl. SSML, wenn aktiv); mit `{{LETTER_RAW}}` bleibt das eigentliche Zeichen verfügbar.

Bei weiteren Fragen einfach `npm run generate:letters -- --help` ausführen oder in `SPECS/letter-audio-generator.md` nachlesen.
