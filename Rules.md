# Versions- & Arbeitsregeln

Dieses Dokument beschreibt, wie wir im Monorepo mit Classic- und Island‑Variante versionieren und arbeiten.

## 1. Varianten

- **Classic**  
  - Standard‑Variante, läuft unter `index.html` und `app/` am Root.  
  - Zusätzlich gespiegelt unter `apps/classic/` (Referenzkopie).
- **Island**  
  - Neue Clay‑Insel‑Variante, läuft unter `apps/island/index.html` und `apps/island/app/`.

Beim Entwickeln gilt: Funktionale Änderungen möglichst in Classic testen, UI‑Experimente in Island.

## 2. Git‑Versionierung

Wir versionieren ausschließlich über Git‑Tags, nicht über `package.json` oder Manifest‑Versionen.

- **Classic‑Tags:** `classic-vMAJOR.MINOR.PATCH`
  - Beispiel: `classic-v1.3.0`
- **Island‑Tags:** `island-vMAJOR.MINOR.PATCH`
  - Beispiel: `island-v0.1.0` (Early Preview)

Empfohlene Praxis:

1. Feature/Änderungen normal auf `main` committen.
2. Wenn ein Stand stabil und deployed ist (z. B. auf GitHub Pages), einen passenden Tag setzen:
   ```bash
   git tag classic-v1.3.0
   git push --tags
   ```
3. Größere visuelle Meilensteine in Island separat taggen, ohne Classic zu beeinflussen:
   ```bash
   git tag island-v0.2.0
   ```

## 3. Commit-Konvention (leichtgewichtig)

Es genügt eine grobe Kennzeichnung in der Commit‑Message:

- `[classic] …` – betrifft nur Classic‑Variante
- `[island] …` – betrifft nur Island‑Variante
- `[both] …` – gemeinsame Logik/Shared-Code

Beispiele:

- `[island] Clay-Start-Hub mit neuen Assets`
- `[classic] Bugfix beim Lernweg-Fortschritt`
- `[both] ProgressStore für mehrere Profile erweitert`

## 4. Dokumentation

- Technische Spezifikationen: `ProjectData/SPECS/`  
- Neues UI‑Konzept (Island): `ProjectData/Requirements new UI/`  
- Taskliste / Roadmap: `ProjectData/TASKS.md`

`journal.md` bleibt für freie Entwicklungsnotizen; Versionsregeln und Repo‑Struktur werden ausschließlich hier (`Rules.md`) und in `AGENTS.md` beschrieben.

