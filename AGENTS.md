# Hinweise für AI-Agents

Dieses Repository enthält zwei UI‑Varianten (Classic & Island) und diverse Spezifikationsdateien. Bitte beachte beim Arbeiten folgende Regeln:

## 1. Varianten & Pfade

- **Classic (Standard‑Variante)**
  - Root‑App unter `index.html` und `app/`.
  - Referenzkopie unter `apps/classic/`.
- **Island (Clay‑Insel‑Variante)**
  - UI‑Experiment unter `apps/island/index.html` und `apps/island/app/`.

Änderungen:

- Funktionale / Logik‑Änderungen möglichst so implementieren, dass sie sowohl Classic als auch Island nutzen können (Shared‑Module bevorzugen).
- Reine UI‑Experimente nur in `apps/island/` durchführen, Classic visuell möglichst stabil lassen.

## 2. Versionierung

- Es gibt keine „Version“ in `package.json` – Releases werden über **Git‑Tags** markiert.
- Tag‑Konventionen (vom Menschen zu setzen, nicht vom Agent):
  - Classic: `classic-vMAJOR.MINOR.PATCH` (z. B. `classic-v1.3.0`)
  - Island: `island-vMAJOR.MINOR.PATCH` (z. B. `island-v0.2.0`)
- Agents sollen **keine Tags** anlegen, aber Code‑ und Doku‑Änderungen im Sinne dieser Konvention planen.

Details und Beispiele siehe `Rules.md`.

## 3. Dokumentation & Specs

- Technische Architektur & Logik: `ProjectData/SPECS/`
- Neues UI‑Konzept & Design‑System (Island): `ProjectData/Requirements new UI/`
- Aufgabenliste / Roadmap: `ProjectData/TASKS.md`
- Projektweite Regeln: `Rules.md`

Bei Änderungen an UI/UX oder Spiel‑Logik nach Möglichkeit zuerst in den entsprechenden Specs nachsehen und diese bei größeren Abweichungen aktualisieren.

## 4. Stil & Vorsicht

- Änderungen klein und fokussiert halten; keine großflächigen Refactorings ohne Notwendigkeit.
- Tests, sofern vorhanden, nach Logik-Änderungen bevorzugt ausführen oder zumindest gedanklich durchgehen.
- Keine sensiblen Daten (API-Keys etc.) in Dateien einchecken; `.env` und ähnliche Dateien ignorieren.
- Bei funktionalen/UI-Änderungen: CHANGELOG.md aktualisieren und relevante Doku unter `ProjectData/SPECS` und `ProjectData/Requirements` kurz nachziehen (1–2 Sätze reichen), solange nichts dagegen spricht.
