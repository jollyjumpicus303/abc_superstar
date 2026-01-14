# Guidance for AI Agents

This repository contains the Classic variant and related specification files. Please follow these rules while working:

## 1. Variants & Paths

- **Classic (standard variant)**
  - Root app under `index.html` and `app/`.
  - Reference copy under `apps/classic/`.

Changes:

- Maintain functional/logic changes in the root (`app/`) and sync `apps/classic/` as needed.
- Keep Classic visuals stable; do not introduce new variants.

## 2. Continuous Quality Improvement (CQI)

If you discover refactoring needs, structural issues, or UX improvement opportunities while working, log them in `quality_backlog.md`.
Use the table format below and add a new row with the next ID (Q-###).
Keep entries short and actionable.

## 3. Versioning

- There is no "version" in `package.json` - releases are marked via **git tags**.
- Tag convention (set by humans, not the agent):
  - Classic: `classic-vMAJOR.MINOR.PATCH` (e.g. `classic-v1.3.0`)
- Agents must **not** create tags, but plan code/doc changes according to this convention.

Details and examples: `Rules.md`.

## 4. Documentation & Specs

- Technical architecture & logic: `ProjectData/SPECS/`
- Product requirements: `ProjectData/Requirements/`
- Task list / roadmap: `ProjectData/TASKS.md`
- Project rules: `Rules.md`

For UI/UX or gameplay changes, update `CHANGELOG.md` and the relevant docs under `ProjectData/SPECS` and `ProjectData/Requirements` (1-2 sentences is enough) unless there is a reason not to.

## 5. Style & Caution

- Keep changes small and focused; avoid large refactors without a clear need.
- If logic changes, prefer running tests (if available) or at least mentally validate.
- Do not commit sensitive data (API keys, etc.); ignore `.env` and similar files.

## 6. Communication & Language

**MUST**
- Respond to the user in **German** unless the user asks otherwise.
- Code comments and docs may remain **English**.
- Keep explanations accessible; include short "why/how" context.
- If an error is fixed, explain what it was and what changed.
- If a task is finished, recommend whether a short user test is needed and how to do it.

**SHOULD**
- Avoid deep technical dumps unless asked.
- When presenting options, recommend one approach aligned with best practices and the existing implementation.
