# Parent-Hub UX – Aufnahmen & Sets

Ziel: Aufnahmen und Set-Verwaltung in einem kombinierten Bereich anbieten, damit der Set-Kontext direkt beim Aufnehmen sichtbar/wechselbar bleibt. Zusätzlich sollen Profilstatistiken in der Übersicht per Klick auf die Profilkarte umschaltbar sein.

## Anforderungen
- **Kombinierter Tab:** Ein Tab „Aufnahmen & Sets“ ersetzt die getrennten Tabs „Aufnahmen“ und „Sets & Extras“. Inhalt: zuerst Set-Auswahl/-Verwaltung, darunter Aufnahme-Raster + Recorder, anschließend Extras (Motivations- & Medaillen-Sounds).
- **Set-Kontext:** Aktives Set ist im kombinierten Tab sichtbar und wechselbar; Änderungen wirken sofort auf Aufnahme-Raster/Recorder.
- **Profil-Statistik-Switch:** Profilkarten in der Übersicht sind klickbar und setzen das aktive Profil; Statistiken aktualisieren ohne Umweg über das Profilmodal.
- **Responsives Verhalten:** Desktop: Sidebar-Navigation, Inhalte gestapelt. Mobile: Inhalte untereinander, kein zusätzlicher Tab-Wechsel nötig.
- **Zugänglichkeit:** Fokusfähige Profilkarten, Hover/Focus-Feedback, klarer aktiver Status (Badge „aktiv“).
- **Profilbasierte Statistiken:** Versuche werden pro aktivem Profil in IndexedDB abgelegt (Attempt-Log, max. ca. 400 Einträge). Die Übersicht wertet nur dieses Log des aktiven Profils aus, zeigt bei <10 Einträgen einen Hinweis und trennt klar zwischen Herausforderungen und „Super-Buchstaben“ (mind. 5 richtige, keine Fehler).

## Akzeptanzkriterien
- Nur noch zwei Haupt-Tabs im Eltern-Hub: „Übersicht“ und „Aufnahmen & Sets“.
- Set-Listen, Default-Set-Auswahl und Extras befinden sich im gleichen Tab wie das Aufnahme-Raster; Set-Wechsel ohne Tab-Wechsel.
- Klick auf ein Profil in der Übersicht setzt das aktive Profil und aktualisiert Stats; Edit/Delete bleiben über die Aktionsbuttons erreichbar.
- Bestehende Flows (Import/Export, Serienaufnahme, Motivations-/Medaillen-Sounds) bleiben erhalten.
