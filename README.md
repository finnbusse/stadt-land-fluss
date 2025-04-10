# Stadt Land Fluss - Multiplayer Online-Spiel

Ein vollständig funktionsfähiges Multiplayer "Stadt Land Fluss" Spiel, das mit Firebase Realtime Database betrieben wird und Echtzeit-Interaktionen zwischen Spielern ermöglicht.

![Stadt Land Fluss](https://zgbncfke.manus.space/assets/stadt-land-fluss-preview.png)

## Live-Demo

Die Anwendung ist live unter folgender URL verfügbar:
[https://zgbncfke.manus.space](https://zgbncfke.manus.space)

## Spielkonzept

"Stadt Land Fluss" ist ein klassisches Wortspiel, bei dem Spieler zu einem bestimmten Buchstaben passende Begriffe in verschiedenen Kategorien finden müssen. Diese Online-Version erweitert das traditionelle Spiel mit modernen Multiplayer-Funktionen.

## Hauptfunktionen

### Lobby-System
- Erstellen oder Beitreten einer Lobby mit einem eindeutigen Lobby-Code
- Unterstützung für bis zu 6 Spieler pro Lobby
- Individuelle Benutzernamen für jeden Spieler
- Der erste Spieler wird automatisch zum Host

### Host-Funktionen
- Konfiguration von bis zu 10 benutzerdefinierten Kategorien (nicht nur Stadt, Land, Fluss)
- Spieler aus der Lobby entfernen
- Spiel jederzeit pausieren
- Aktuelle Runde beenden und zur Lobby zurückkehren
- Spiel vollständig beenden und Lobby schließen
- Festlegen eines bestimmten Buchstabens oder Generieren eines zufälligen, unbenutzten Buchstabens
- Sicherstellung, dass kein Buchstabe innerhalb derselben Lobby wiederverwendet wird
- Einsicht in alle eingereichten Spielerantworten

### Spielfunktionalität
- Eingabe von Antworten für jede Kategorie basierend auf dem Buchstaben der Runde
- Keine Zeichenbegrenzung für Antworten
- Jeder Spieler kann die Runde für Gruppendiskussionen pausieren
- Spieler vergeben sich selbst Punkte für ihre Antworten: 5, 10 oder 20 Punkte pro Feld
- Alle Punkte und Einreichungen werden in der Firebase Realtime Database gespeichert

## Technologie-Stack

- Frontend: React mit Vite als Build-Tool
- Styling: Styled Components für modulares CSS-in-JS
- Echtzeit-Datenbank: Firebase Realtime Database
- Routing: React Router für Navigation zwischen Seiten
- Deployment: Gehostet auf manus.space

## Entwickelt von

Dieses Projekt wurde von Manus entwickelt als Teil einer Aufgabe zur Erstellung eines vollständigen Multiplayer-Spiels mit Echtzeit-Funktionalität.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz - siehe die [LICENSE](LICENSE) Datei für Details.

## Setup-Anleitung

Für Informationen zur lokalen Einrichtung und Entwicklung siehe die [02_SETUP.md](02_SETUP.md) Datei.
