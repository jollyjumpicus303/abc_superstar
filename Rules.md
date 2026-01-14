# Versions- & Arbeitsregeln

Dieses Dokument beschreibt, wie wir im Repo die Classic-Variante versionieren und arbeiten.

## 1. Variante

- **Classic**
  - Standard-Variante, laeuft unter `index.html` und `app/` am Root.
  - Zusaetzlich gespiegelt unter `apps/classic/` (Referenzkopie).

Beim Entwickeln gilt: Classic im Root pflegen und die Referenzkopie bei Bedarf nachziehen.

## 2. Git-Versionierung

Wir versionieren ausschliesslich ueber Git-Tags, nicht ueber `package.json` oder Manifest-Versionen.

- **Classic-Tags:** `classic-vMAJOR.MINOR.PATCH`
  - Beispiel: `classic-v1.3.0`

Empfohlene Praxis:

1. Feature/Aenderungen normal auf `main` committen.
2. Wenn ein Stand stabil und deployed ist (z.B. auf GitHub Pages), einen passenden Tag setzen:
   ```bash
   git tag classic-v1.3.0
   git push --tags
   ```

## 3. Commit-Konvention (leichtgewichtig)

Es genuegt eine grobe Kennzeichnung in der Commit-Message:

- `[classic] ...` - betrifft nur die Classic-Variante
- `[core] ...` - zentrale Logik/Shared-Code

Beispiele:

- `[classic] Bugfix beim Lernweg-Fortschritt`
- `[core] ProgressStore fuer mehrere Profile erweitert`

## 4. Dokumentation

- Technische Spezifikationen: `ProjectData/SPECS/`
- Produktanforderungen: `ProjectData/Requirements/`
- Taskliste / Roadmap: `ProjectData/TASKS.md`

`journal.md` bleibt fuer freie Entwicklungsnotizen; Versionsregeln und Repo-Struktur werden ausschliesslich hier (`Rules.md`) und in `AGENTS.md` beschrieben.
