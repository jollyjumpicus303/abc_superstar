# Quality Backlog (CQI)

Log refactoring needs, structural issues, or UX improvement opportunities discovered during tasks.
Add new rows with the next ID (Q-###).

| ID    | Area   | Severity | Description | Proposal | Effort | Location | Fix now? | Notes |
|------:|--------|----------|-------------|----------|--------|----------|----------|-------|
| Q-001 | UI/UX  | Med      |             |          | S      |          | N        |       |
| Q-002 | UI/UX  | Low      | UI-Strings zeigen Mojibake in Warnungen | Encoding pruefen und Strings vereinheitlichen | M | app/main.js | N | In mehreren Warnungen sichtbar |
| Q-003 | Data   | Low      | Buchstaben-Statistik nutzt case-sensible Keys und splittet ggf. Gross/Klein | Keys beim Schreiben normalisieren (z.B. uppercase) | S | app/main.js | N | Betrifft letterStats |
