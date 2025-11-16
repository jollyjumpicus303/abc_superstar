# Projektdokumentation: ABC-Abenteuer

Willkommen zur technischen Dokumentation des Projekts "ABC-Abenteuer". Dieses Dokument dient als zentraler Einstiegspunkt, um die Architektur, die Kernkonzepte und die Implementierungsdetails der Anwendung zu verstehen.

## Übersicht

Das ABC-Abenteuer ist eine interaktive Lernanwendung, die Kindern auf spielerische Weise das Alphabet näherbringt. Die App basiert auf Web-Technologien und ist als Progressive Web App (PWA) konzipiert, um eine offline-fähige Nutzung auf verschiedenen Geräten zu ermöglichen.

Die Dokumentation ist in die folgenden Bereiche unterteilt, um eine klare Struktur zu gewährleisten:

- **[Spiel-Logik](./game-logic/):** Beschreibt die Kernmechaniken des Spiels, wie die Auswahl von Buchstaben und die Fortschrittsregeln.
- **[Datenmodell & Persistenz](./data/):** Definiert die Struktur der gespeicherten Daten und wie diese verwaltet werden.
- **[Benutzeroberfläche & UX](./ui/):** Erläutert die Gestaltung der Benutzeroberfläche und die Interaktionskonzepte.

## Architektur

Die Anwendung ist eine clientseitige Single-Page-Application (SPA), die hauptsächlich aus HTML, CSS und JavaScript besteht. Die zentrale Anwendungslogik befindet sich in `app/main.js`, während wiederverwendbare Module in separaten Dateien im `app`-Verzeichnis ausgelagert sind.

### Wichtige Module

- **`app/main.js`**: Enthält die Hauptlogik der Anwendung, die Spielsteuerung und die Interaktion mit der Benutzeroberfläche.
- **`app/letterPool.js`**: Implementiert die Logik zur Auswahl des nächsten Buchstabens basierend auf verschiedenen Kriterien.
- **`app/progressStore.js`**: Verwaltet die Speicherung und den Abruf des Benutzerfortschritts im `localStorage`.
- **`app/progression.js`**: Definiert die Regeln für den "Lernweg"-Modus.

## Inkonsistenzen und Besonderheiten

Während der Entwicklung haben sich einige Abweichungen zwischen der ursprünglichen Spezifikation und der finalen Implementierung ergeben. Die wichtigsten Punkte sind:

- **Monolithische `main.js`**: Ein Grossteil der Anwendungslogik ist in `app/main.js` konzentriert, was die Wartbarkeit erschwert. Zukünftige Refactorings sollten darauf abzielen, diese Datei in kleinere, spezialisierte Module aufzuteilen.
- **Veraltete Konzepte**: Einige ursprünglich geplante Funktionen wie `audioSet`s und `makeOptions` wurden im Laufe der Entwicklung verworfen, sind aber teilweise noch in älteren Dokumentationsversionen oder im Code als "toter Code" vorhanden. Diese wurden im Rahmen der aktuellen Überarbeitung aus der Dokumentation entfernt.

Für eine detailliertere Übersicht über geplante Code-Verbesserungen, siehe die [TASKS.md](../../TASKS.md) Datei im Hauptverzeichnis.
