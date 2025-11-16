# LETTER_POOL – Auswahlregeln

## Ziel
Deterministische, testbare Auswahl des nächsten Zielbuchstabens für eine Übungsrunde.

## Regeln
- **Poolquelle:** Der Pool der möglichen Buchstaben wird durch den Spielmodus bestimmt (z.B. freigeschaltete Buchstaben im Lernweg-Modus).
- **Keine Direkt‑Wiederholung:** Der nächste Buchstabe (`next`) darf nicht mit dem letzten (`last`) identisch sein.
- **Recent‑Sperre:** Eine kurze Liste der zuletzt gewählten Buchstaben (`recent`, Grösse 2–3) wird genutzt, um die Vielfalt zu erhöhen und nahe Wiederholungen zu vermeiden.
- **Fehlergewichtung:** Buchstaben, die zuvor falsch beantwortet wurden, erhalten ein höheres Gewicht, um sie häufiger auszuwählen. Das Gewicht wird berechnet als `w(letter) = 1 + 2 * wrongCounts[letter]` (bis zu einem Maximalwert von 7).
- **Fehlervorgabe:** Um sicherzustellen, dass Fehler korrigiert werden, wird mindestens jeder dritte Pick aus der Liste der falsch beantworteten Buchstaben gewählt, falls diese nicht leer ist.

## API
- `pickNext({ pool, last, wrongCounts, recent=[] }): string`

## Tests
- Die Tests sollen sicherstellen, dass keine direkten Wiederholungen auftreten.
- Es soll geprüft werden, dass Buchstaben, die häufiger falsch waren, auch mit einer höheren Wahrscheinlichkeit ausgewählt werden.

## Codex‑Prompt
> **Codex:** Erstelle ein Modul `app/letterPool.(ts|js)` mit einer Funktion `pickNext`, die die oben genannten Regeln zur Auswahl des nächsten Buchstabens umsetzt. Erstelle eine Test-Suite `tests/letterPool.test.(ts|js)` (mit Jest oder Vitest), die das Wiederholungsverbot und die korrekte Gewichtung der Auswahl überprüft.
