# Hinweise fuer AI-Agents

Dieses Repository enthaelt die Classic-Variante und diverse Spezifikationsdateien. Bitte beachte beim Arbeiten folgende Regeln:

## Communication & Language
**MUST**
- Respond to the user in **German** unless the user asks otherwise.
- Code comments and docs may remain **English**.
- Keep explanations accessible, include short “why/how” context.
- If an error is fixed, explain what it was and what changed.
- If a task is finished, recommend whether a short user test is needed and how to do it.

**SHOULD**
- Avoid deep technical dumps unless asked.
- When presenting options, recommend one approach aligned with best practices and the existing implementation.

## 1. Varianten & Pfade

- **Classic (Standard-Variante)**
  - Root-App unter `index.html` und `app/`.
  - Referenzkopie unter `apps/classic/`.

Aenderungen:

- Funktionale / Logik-Aenderungen im Root (`app/`) pflegen; `apps/classic/` bei Bedarf nachziehen.
- Classic visuell moeglichst stabil halten; keine neuen Varianten anlegen.

## 2. Versionierung

- Es gibt keine "Version" in `package.json` - Releases werden ueber **Git-Tags** markiert.
- Tag-Konvention (vom Menschen zu setzen, nicht vom Agent):
  - Classic: `classic-vMAJOR.MINOR.PATCH` (z.B. `classic-v1.3.0`)
- Agents sollen **keine Tags** anlegen, aber Code- und Doku-Aenderungen im Sinne dieser Konvention planen.

Details und Beispiele siehe `Rules.md`.

## 3. Dokumentation & Specs

- Technische Architektur & Logik: `ProjectData/SPECS/`
- Produktanforderungen: `ProjectData/Requirements/`
- Aufgabenliste / Roadmap: `ProjectData/TASKS.md`
- Projektweite Regeln: `Rules.md`

Bei Aenderungen an UI/UX oder Spiel-Logik nach Moeglichkeit zuerst in den entsprechenden Specs nachsehen und diese bei groesseren Abweichungen aktualisieren.

## 4. Stil & Vorsicht

- Aenderungen klein und fokussiert halten; keine grossflaechigen Refactorings ohne Notwendigkeit.
- Tests, sofern vorhanden, nach Logik-Aenderungen bevorzugt ausfuehren oder zumindest gedanklich durchgehen.
- Keine sensiblen Daten (API-Keys etc.) in Dateien einchecken; `.env` und aehnliche Dateien ignorieren.
- Bei funktionalen/UI-Aenderungen: CHANGELOG.md aktualisieren und relevante Doku unter `ProjectData/SPECS` und `ProjectData/Requirements` kurz nachziehen (1-2 Saetze reichen), solange nichts dagegen spricht.
