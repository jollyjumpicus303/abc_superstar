# Adaptive Practice – Fehler-Wiederholung

## Mechanik
- Fehler werden in `wrongCounts` gezählt.  
- Gewichtung siehe `LETTER_POOL`.  
- **Quote:** Max. 40 % der Runden aus Fehlerliste; Mindestabstand 2 Runden.  
- **Decay:** Nach **2 korrekten Treffern** für denselben Buchstaben wird sein Fehlergewicht um 1 reduziert (bis 0).

## Codex‑Prompt
> **Codex:** Ergänze `progressStore.markCorrect/markWrong` um Decay‑Logik wie beschrieben. Passe `letterPool` an, damit mindestens jeder 3. Pick (falls möglich) aus der Fehlerliste kommt, ohne Direkt‑Wiederholung.
