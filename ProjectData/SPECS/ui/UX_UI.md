# UX & UI – Gestaltung und Interaktion

Dieses Dokument beschreibt die grundlegenden Aspekte der Benutzeroberfläche (UI) und der Benutzererfahrung (UX) für die ABC-Abenteuer-App.

## Modus-Auswahl

Die Auswahl des Spielmodus ist ein zentraler Einstiegspunkt für die Nutzer.

- **Titel:** Die Sektion wird mit einer freundlichen Frage eingeleitet, z.B. „Wie möchtest du heute spielen?“
- **Auswahlkarten:** Anstelle von einfachen Buttons werden grosse, visuell ansprechende Karten für die verschiedenen Modi verwendet:
  - 🐣 **Anfänger:** Startet ein freies Spiel mit einfachen Einstellungen.
  - 🦋 **Lernweg:** Führt den Nutzer durch den strukturierten Abenteuer-Pfad (Gross- und Kleinbuchstaben nacheinander).
  - 🦸 **Meister:** Bietet eine Herausforderung mit schwierigen Einstellungen im freien Spiel.
- **Feedback:** Die jeweils aktive Auswahl wird deutlich hervorgehoben, um dem Nutzer eine klare Orientierung zu geben.
- **Runden-Default:** Im freien Modus startet die Rundenzahl bei 5.
- **Buchstaben-Typ:** Im freien Modus kann zwischen Gross-, Klein- und gemischten Buchstaben gewechselt werden; bei gemischt ist die Buchstabenanzahl in 4er-Schritten waehlbar.

## Belohnungen und Feedback

Positive Verstärkung ist ein Kernelement der App.

- **Belohnungsbanner:** Nach dem Erreichen eines Meilensteins (z.B. Freischalten neuer Buchstaben) erscheint ein auffälliges Banner mit einer positiven Botschaft wie „Nächste Stufe freigeschaltet!“.
- **Visuelles Feedback:** Erfolgreiche oder falsche Aktionen werden durch Animationen und farbliche Hervorhebungen begleitet.

### Sticker-Album (Register & Animation)
- Tabs wirken wie Registerblätter: jedes Thema hat eigene, aber dezente Farben (Tab + Inhaltshintergrund), aktiver Tab hebt sich per Schatten/Absenkung ab.
- Album-Fläche wird je nach Thema eingefärbt (Slot-Background, Rahmen, Text), damit Kinder klar erkennen, in welchem Abschnitt sie sind.
- Animationslogik: einmaliges Rendern pro Pack, danach pro Slot „reveal“ mit kurzem Pop; bei Duplikaten keine Reveal-Animation, stattdessen eigener Boink-Sound.
- Duplikate werden freundlich kommuniziert (Alert) und haben einen kurzen Audioschnipsel, damit klar ist, dass nichts Neues hinzugekommen ist.

## Visuelles Design und Styling

Das Design der App ist darauf ausgelegt, kinderfreundlich, ansprechend und modern zu sein.

- **Farbpalette:** Das Farbschema basiert auf einem dunklen, nachthimmelartigen Hintergrund (`#0f1022`) mit leuchtenden, freundlichen Akzentfarben. Farbverläufe von Blau- zu Violett-Tönen (z.B. `#8ec5fc` zu `#e0c3fc`) werden für interaktive Elemente wie das Logo verwendet, um einen magischen Eindruck zu erzeugen.
- **Typografie:** Für Überschriften und wichtige Texte wird eine runde, verspielte Schriftart wie "Baloo 2" verwendet, während für den Fliesstext eine gut lesbare Sans-Serif-Schrift wie "Inter" zum Einsatz kommt.
- **Formen und Schatten:** Abgerundete Ecken (`--radius: 22px`) und weiche Schatten (`--shadow-1`, `--shadow-2`) verleihen der Benutzeroberfläche eine weiche, organische Anmutung.
- **Animationen:** Dezente Animationen, wie ein leichtes "Glühen" (`glow`-Animation) von Sternen im Hintergrund oder "Bounce"-Effekte bei Klicks, sorgen für eine lebendige und interaktive Atmosphäre.

## Barrierefreiheit

Die App soll für alle Nutzer zugänglich sein.

- **Grosse Touch-Ziele:** Alle interaktiven Elemente sind gross genug, um auf Touch-Geräten leicht bedienbar zu sein.
- **Klare Kontraste:** Die Farbkontraste zwischen Text und Hintergrund sind ausreichend hoch, um eine gute Lesbarkeit zu gewährleisten.
- **Reduzierte Bewegung:** Die App respektiert die `prefers-reduced-motion`-Einstellung des Betriebssystems, um Animationen für empfindliche Nutzer zu deaktivieren.

## Responsives Verhalten (Hauptansicht)

In kurzen Querformat-Ansichten werden Header, Abstaende und das Buchstaben-Grid kompakter, damit Spiel/Üben/Album moeglichst ohne Scrollen sichtbar bleiben.

## Elternbereich – Statistiken

- Statistiken im Eltern-Hub lesen einen profilbezogenen Attempt-Log (IndexedDB) aus; jeder Versuch wird mit Ziel, Wahl, Ergebnis gespeichert.
- Auswertung erfolgt pro aktivem Profil; Hinweis, falls <10 Versuche vorliegen.
- „Super-Buchstaben“: nur Buchstaben mit mindestens 5 richtigen Treffern und keinen Fehlern. „Herausforderungen“ zeigen die häufigsten Fehler inkl. häufigster Verwechslung.

## Codex‑Prompt
> **Codex:** Baue im Einstellungs‑Tab eine Modus‑Sektion mit drei grossen Karten (Buttons). Die aktive Auswahl wird visuell hervorgehoben. Implementiere Tooltips/Hinweise bei fehlenden Aufnahmen und verlinke direkt zum Aufnahme‑Bereich.

## Extra-Sounds – Motivation & Medaillen

Erwachsene können neben den Buchstabenaufnahmen zusätzliche Clips pflegen.

- **Separater Card-Bereich:** Unterhalb (bzw. rechts neben) dem Recorder gibt es
  eine eigene Karte „Extra-Sounds“ mit zwei Blöcken – Motivation und
  Medaillen. So bleibt der Buchstaben-Recorder übersichtlich.
- **Motivation:** Globale Clips („Du schaffst das!“) erscheinen in einer Liste
  mit Play-/Löschknopf. Zwei Aktionen stehen bereit: Aufnahme per Mikrofon und
  Mehrfach-Upload (Datei-Dialog, `audio/*`). Die Liste zeigt den Status (Anzahl
  Clips, Zeitstempel) übersichtlich an.
- **Medaillen:** Für Gold/Silber/Bronze existieren eigene Karten mit Emoji,
  Statusanzeige (z. B. „3 Clips“), Buttons für Aufnahme & Upload sowie einer
  Liste sämtlicher Clips pro Rang. Jedes Item bietet Play/Löschen.
- **Themes:** Die Karte nutzt dieselben Design-Tokens wie der Recorder
  (`var(--surface)`, `var(--surface-soft)` usw.), damit Classic/Nachthimmel
  automatisch konsistent bleiben.
- **Interaktion:** Alle Buttons folgen den bereits bekannten Primär-/Sekundär-
  Stilen. Clip-Listen haben begrenzte Höhe und Scrollbar, damit das Layout auch
  bei vielen Uploads stabil bleibt.

## Aufnahme-UI & Buchstaben-Status

Der Recorder im Einstellungs-Tab dient als Schaltzentrale für neue Clips.

- **Ein Button, zwei Modi:** Es gibt nur noch einen primären CTA „Aufnehmen“,
  flankiert von einem Toggle „Serienaufnahme (springt automatisch weiter)“.
  Ist der Toggle aktiv, bleibt er bis zum Stopp deaktiviert und der Button
  trägt den Status „⏹️ Serie stoppen“. Ohne Toggle verhält sich der Button als
  reine Einzelaufnahme.
- **Timer & Aktionen:** Testen/Löschen sitzen unterhalb des Buttons, der Timer
  rechtsbündig. Während einer Aufnahme sind beide Buttons deaktiviert.
- **Visuelles Feedback im Grid:** Das Buchstaben-Board markiert den aktuell
  ausgewählten Buchstaben mit einem hellen Rahmen sowie einer sanften
  Puls-Animation (auch im Nachtmodus). So sieht man auf einen Blick, wo man
  sich befindet – sogar dann, wenn der Recorder zugeklappt ist.
