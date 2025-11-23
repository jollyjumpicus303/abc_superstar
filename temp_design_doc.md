# Design-Vorschlag: Vereinheitlichtes Eltern-Dashboard

## Ziel
Zusammenführung der bisher getrennten Bereiche "Elternbereich" (Statistiken) und "Einstellungen" (Aufnahmen, Sets) in einen zentralen, geschützten Hub. Dies vereinfacht die Navigation, erhöht die Sicherheit (Parental Gate) und bündelt alle administrativen Aufgaben an einem logischen Ort.

## Hauptmerkmale

### 1. Zentraler Zugang (Single Entry Point)
*   **Neuer Zugang:** Ein einziger Button "Eltern-Dashboard" in der Hauptnavigation (ersetzt "Eltern" und "Einstellungen").
*   **Sicherheit:** Der gesamte Bereich ist durch ein **Parental Gate** (Rechenaufgabe) geschützt. Kinder können nicht versehentlich Einstellungen ändern oder Aufnahmen löschen.

### 2. Neue Navigationsstruktur
Das Dashboard wird intern durch eine Sidebar (oder Tabs auf Mobile) in drei logische Bereiche unterteilt:

#### A. 📊 Übersicht (Home)
*   **Ziel:** Schneller Überblick über Profile und Fortschritt.
*   **Inhalte:**
    *   **Profil-Management:** Liste aller Kinder-Profile mit Bearbeiten/Löschen-Optionen.
    *   **Statistiken:** Zusammenfassung des Lernfortschritts (z.B. "Super-Buchstaben", "Herausforderungen").
    *   **Quick Actions:** "Neues Profil anlegen".

#### B. 🎤 Aufnahmen (Recording Studio)
*   **Ziel:** Der zentrale Arbeitsplatz für das Einsprechen der Buchstaben.
*   **Inhalte:**
    *   **Buchstaben-Raster:** Übersicht über den Aufnahmestatus (A-Z).
    *   **Recorder:** Das Aufnahmepanel mit "Serienaufnahme"-Funktion.
    *   **Set-Wahl:** Schnelles Umschalten des aktiven Sets für die Bearbeitung.
    *   **Import:** Einzelne Buchstaben importieren.

#### C. ⚙️ Sets & Extras (Verwaltung)
*   **Ziel:** Verwaltung von Sets und Belohnungen.
*   **Inhalte:**
    *   **Set-Management:** Erstellen, Umbenennen und Löschen ganzer Aufnahme-Sets (z.B. "Mama", "Papa", "Opa").
    *   **Belohnungs-Töne:** Upload eigener Sounds für Medaillen (Gold/Silber/Bronze).
    *   **Motivations-Sounds:** Verwalten von Trost-Sounds bei Fehlern.
    *   **Daten-Management:** Globaler Export/Import (Backup).

## Design & UX
*   **Visueller Stil:** Konsistent mit dem "Island UI" (weiche Schatten, runde Ecken), aber mit einem reduzierteren, übersichtlicheren Layout für Erwachsene.
*   **Feedback:** Klare Statusanzeigen (z.B. "0 von 26 Buchstaben aufgenommen").
*   **Responsivität:** Sidebar-Layout auf Desktop/Tablet, das auf Mobile in eine Tab-Leiste oder ein Hamburger-Menü umbricht.

## Vorteile
1.  **Klarheit:** Eltern müssen nicht suchen, wo sie Profile oder Aufnahmen finden. Alles ist an einem Ort.
2.  **Fokus:** Der "Spiel"-Bereich bleibt rein für die Kinder, ohne störende Einstellungs-Buttons.
3.  **Skalierbarkeit:** Das Dashboard bietet Platz für zukünftige Features (z.B. detailliertere Lernkurven oder Zeitlimits).
