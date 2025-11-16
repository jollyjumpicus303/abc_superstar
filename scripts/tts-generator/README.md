# TTS Audio Generator

Dieses Dokument beschreibt das CLI-Tool zur Generierung von Audio-Sets für die ABC-Abenteuer-App mithilfe von Text-to-Speech (TTS)-Anbietern.

## Inhaltsverzeichnis
- [Struktur](#struktur)
- [Ziel](#ziel)
- [Aktueller Stand (CLI)](#aktueller-stand-cli)
- [Funktionsumfang](#funktionsumfang)
- [Offene Punkte](#offene-punkte)

## Struktur
Alle Artefakte für den TTS-Generator befinden sich in diesem Verzeichnis (`scripts/tts-generator`):
- **`generateLetters.js`**: Das Hauptskript zur Generierung der Audio-Dateien.
- **`splitVariantSets.js`**: Ein Hilfsskript, um generierte Sets nach Stimmen aufzuteilen.
- **`lib/`**: Enthält wiederverwendbare Module für das Hauptskript.
- **`config/`**: Beinhaltet alle Konfigurationsdateien (`generator.config.json`, `openai_generator.config.json`, etc.).
- **`.env.example`**: Eine Vorlage für die Umgebungs-Variablen, die die API-Schlüssel enthalten.

## Ziel
Ein CLI-Tool erzeugt vollwertige Audio-Sets für alle Buchstaben (oder eine Teilmenge) mithilfe von TTS-Anbietern (OpenAI, optional ElevenLabs). Das Tool generiert alle vier Schwierigkeiten (LEICHT, MITTEL, SCHWER, AFFIG) und beliebige Varianten (z.B. verschiedene Stimmen). Das Ergebnis ist ein ZIP-Archiv, das direkt über die bestehende Import-Funktion der App eingespielt werden kann.

## Aktueller Stand (CLI)
- **Script-Aufruf:**
  - `npm run generate:letters -- [Optionen]`
  - `npm run split:variants -- [Optionen]`
- **Konfiguration:**
  - Die Konfigurationsdateien befinden sich im `config/`-Verzeichnis (z.B. `config/generator.config.json`).
  - Die `generator.config.example.json` dient als Vorlage für die eigene Konfiguration.
- **Secrets:**
  - Erstelle eine `.env`-Datei in diesem Verzeichnis (`scripts/tts-generator`) basierend auf der `.env.example`-Vorlage.
  - Trage dort die API-Schlüssel für `OPENAI_API_KEY` und/oder `ELEVENLABS_API_KEY` ein.
- **Beispiele:**
  - **Dry-Run:** `npm run generate:letters -- --provider openai --voice alloy --letters A,B --difficulties LEICHT --dry-run --log-text`
  - **Produktiv:** `npm run generate:letters -- --variants youth_female,adult_storyteller --letters A,B,C --out dist/anlaut.zip`
  - **Post-Processing:** `npm run split:variants -- --inputs dist/letters-eleven-part1.zip,dist/letters-eleven-part2.zip --out-dir dist/by-variant`

## Funktionsumfang
1. **CLI-Aufruf**
   - `npm run generate:letters -- --letters=A,B,C --variants=youth_female,adult_male --provider=openai --set-name="Anlaut Trainer" --emoji="🅰️" --out dist/anlaute.zip`
   - Standardmäßig werden alle 26 Buchstaben A–Z erzeugt.
   - Flags:
     - `--letters` (Komma-separiert)
     - `--variants` benannt nach den Sprechstilen/Stimmpresets
     - `--provider` (`openai`, `elevenlabs`, `both`)
     - `--voice-map path/to/config.json` für detaillierte Stimmauswahl
     - `--set-name`, `--emoji`, `--difficulty-filter` (z.B. nur LEICHT/MITTEL)
     - `--dry-run` erzeugt nur Skripte/JSON ohne API-Calls
     - `--out` Zielpfad des ZIP

2. **Inhaltslogik pro Schwierigkeit**
   - LEICHT: Struktur `"<Buchstabe>, wie <Anlautwort>"` (z.B. „A, wie Apfel“). Wörter aus vordefiniertem Lexikon mit Platz für Custom Overrides.
   - MITTEL: Nur Buchstabe in gewünschter Prosodie („Das ist das A“ oder kurz „A“).
   - SCHWER: Ein Wort oder kurzer Begriff, der mit dem Buchstaben startet („Ahoi“, „Ballon“). Optional Variation mit thematischen Listen.
   - AFFIG: Kurzer Witz, Rätsel oder Fun Fact mit Bezug zum Buchstaben. Templating per Markdown/JSON, damit Humortext leicht gepflegt wird.
   - Templates verstehen `{{LETTER}}` (Lautschrift bzw. SSML falls konfiguriert), `{{LETTER_RAW}}` (reiner Buchstabe) und `{{WORD}}`.
   - Texte entstehen aus Prompt-Schablonen (pro Difficulty + Variante). Template-Engine (z.B. EJS/Handlebars light) kombiniert Buchstaben, Stichwörter, Variation (z.B. `{{voice_profile}}`).

3. **Variantenmodell / Export**
   - Jede Variante definiert:
     - Anzeigename (z.B. `"female_young"`)
     - Provider (OpenAI oder ElevenLabs)
     - Voice/Model-ID (`"gpt-4o-mini-tts"`, `"eleven_monkey"` etc.)
     - Sprechgeschwindigkeit, Stil-Tags
   - CLI kann mehrere Varianten generieren. Clips erhalten ID-Suffix `<letter>-<difficulty>-<variant>-<uuid>`.
   - Option, Varianten parallel (Promise.all) zu rendern; Rate-Limit-Handling pro Provider.
   - Optional `--split-variants-out dist/by-variant` erstellt nach Abschluss automatisch ein ZIP pro Stimme (identisch zu `splitVariantSets`). Varianten können via `useSsml` gezielt SSML ausgeben.

4. **TTS-Integration**
   - Offizielle SDKs (`openai`, `elevenlabs-node`). Auth via `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` Environment.
   - Gemeinsames Interface `renderSpeech({provider, voice, text, format})` → Buffer + MIME-Type.
   - Audioformat konfigurierbar (`--format mp3|wav|ogg`, defaults `mp3`).
   - Retries mit exponentiellem Backoff; Logging bei Fehlschlag.

5. **Datenmodell & Output**
   - Zur Laufzeit entsteht ein Set-Objekt analog `sets.json` Erwartung:
     ```json
     {
       "id": "uuid",
       "name": "Anlaut Trainer",
       "emoji": "🅰️",
       "created": 1737140223123,
       "clips": [
         {
           "id": "uuid",
           "letter": "A",
           "difficulty": "LEICHT",
           "created": 1737140223123,
           "file": "A-female_young-LEICHT-uuid.mp3"
         }
       ]
     }
     ```
   - Mehrere Varianten → mehrere Clips pro Buchstabe/Difficulty.
   - Optional mehrere Sets in einer ZIP (z.B. `--group-by-variant`). `sets.json` enthält Array aller Sets, exakt wie Export (`app/main.js:2546-2556`).

6. **ZIP-Erstellung**
   - Struktur:
     ```
     <zip>
     ├─ sets.json
     ├─ <set-id>/
     │  ├─ A-female_young-LEICHT-<id>.mp3
     │  └─ ...
     ```
   - Pfade exakt wie Export (Dateien relativ zum Set-Ordner, `clip.file` entspricht Dateinamen). MIME muss `audio/*` sein, damit Import nicht meckert (`app/main.js:2644-2647`).

7. **Metadaten & Validierung**
   - `letter` wird mit bestehender Helper-Logik kompatibel gehalten (nur `A`–`Z`).
   - `difficulty` immer `LEICHT|MITTEL|SCHWER|AFFIG` (`app/main.js:992-1004`).
   - `created` Zeitstempel in ms.
   - Vor dem Packen optional Lint: doppelte IDs prüfen, Audio-Puffergröße > 0, Text-Cache.

8. **Entwickler-UX**
   - Konfig-Datei `generator.config.json` erlaubt Custom-Prompt-Text, Lexika pro Difficulty, Variation-Definitionen.
   - CLI gibt Fortschritt pro Buchstabe/Difficulty/Variante aus.
   - `--preview <letter>` spielt Beispieltext/Audio über lokale Speakers (optional, falls Browser-API verfügbar).

9. **Tests & Dry-Run**
   - Dry-Run validiert Templates, erstellt nur `sets.json` + Log ohne Audio.
   - Unit-Tests für Text-Generator (Snapshots) und Import-Validator (konsumiert generiertes ZIP und prüft Schema gegen JSON Schema).

## Offene Punkte
1. Humor-/Rätsel-Pool für AFFIG pflegen (JSON mit Templates + Platzhaltern?).
2. Lizenz-/Nutzungsbedingungen für ElevenLabs Stimmen prüfen.
3. Performance: Caching wiederverwendeter Texte bei mehreren Varianten?
4. Option, existierende Aufnahmen in ZIP zu mischen (z.B. manuelles File-Drop)?