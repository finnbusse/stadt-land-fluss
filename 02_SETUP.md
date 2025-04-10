# Stadt Land Fluss - Setup Guide

Diese Anleitung führt Sie durch die Schritte, um das Stadt Land Fluss Multiplayer-Spiel lokal einzurichten und zu entwickeln.

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Software auf Ihrem System installiert ist:

- [Node.js](https://nodejs.org/) (Version 16 oder höher)
- [npm](https://www.npmjs.com/) (wird normalerweise mit Node.js installiert)
- [Git](https://git-scm.com/) für die Versionskontrolle

## Repository klonen

Klonen Sie das Repository mit folgendem Befehl:

```bash
git clone https://github.com/yourusername/stadt-land-fluss.git
cd stadt-land-fluss
```

## Abhängigkeiten installieren

Installieren Sie alle notwendigen Abhängigkeiten mit npm:

```bash
npm install
```

Dies installiert alle im `package.json` definierten Pakete, einschließlich React, React Router, Firebase und Styled Components.

## Firebase-Konfiguration

Das Projekt verwendet Firebase Realtime Database für die Multiplayer-Funktionalität. Die Firebase-Konfiguration ist bereits im Code enthalten und verwendet die folgenden Anmeldedaten:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCcGDUxetiTFGv_FLj2qvw-nC9zEZ6Odi4",
  authDomain: "manus-stadt-land-fluss.firebaseapp.com",
  projectId: "manus-stadt-land-fluss",
  storageBucket: "manus-stadt-land-fluss.firebasestorage.app",
  messagingSenderId: "755419684596",
  appId: "1:755419684596:web:3275fb3ac9f5ebd89c48a1",
  measurementId: "G-83KDSR7V9D",
  databaseURL: "https://manus-stadt-land-fluss-default-rtdb.europe-west1.firebasedatabase.app"
};
```

Diese Konfiguration ist bereits in der Datei `src/firebase/config.js` eingerichtet.

## Entwicklungsserver starten

Um die Anwendung lokal zu entwickeln, starten Sie den Entwicklungsserver mit:

```bash
npm run dev
```

Dies startet den Vite-Entwicklungsserver, der standardmäßig auf http://localhost:3000 läuft. Die Anwendung wird automatisch neu geladen, wenn Sie Änderungen an den Quelldateien vornehmen.

## Anwendung für Produktion bauen

Um die Anwendung für die Produktion zu bauen, führen Sie folgenden Befehl aus:

```bash
npm run build
```

Dies erstellt eine optimierte Version der Anwendung im `dist`-Verzeichnis, die für die Bereitstellung auf einem Webserver bereit ist.

## Vorschau der Produktionsversion

Um eine Vorschau der Produktionsversion anzuzeigen, führen Sie nach dem Build-Prozess folgenden Befehl aus:

```bash
npm run preview
```

Dies startet einen lokalen Server, der die gebaute Anwendung aus dem `dist`-Verzeichnis bereitstellt.

## Projektstruktur

Die Anwendung ist wie folgt strukturiert:

```
stadt-land-fluss/
├── public/             # Statische Assets
├── src/                # Quellcode
│   ├── components/     # React-Komponenten
│   ├── firebase/       # Firebase-Konfiguration und -Dienste
│   ├── App.jsx         # Hauptkomponente
│   ├── main.jsx        # Einstiegspunkt
│   └── index.css       # Globale Styles
├── index.html          # HTML-Template
├── vite.config.js      # Vite-Konfiguration
├── package.json        # Projektabhängigkeiten und Skripte
└── README.md           # Projektdokumentation
```

## Firebase Realtime Database

Die Anwendung verwendet die folgende Datenstruktur in Firebase:

```
lobbies/
  ├── [lobbyCode]/
  │   ├── code: String
  │   ├── host: String
  │   ├── createdAt: Number
  │   ├── players/
  │   │   ├── [playerName]/
  │   │   │   ├── name: String
  │   │   │   ├── isHost: Boolean
  │   │   │   └── joinedAt: Number
  │   ├── categories: Array<String>
  │   ├── status: String ("waiting", "playing", "paused", "roundEnd", "finished")
  │   ├── usedLetters: Array<String>
  │   ├── currentLetter: String
  │   ├── currentRound: Number
  │   ├── roundStartTime: Number
  │   ├── answers/
  │   │   ├── [playerName]/
  │   │   │   ├── [category]/
  │   │   │   │   ├── value: String
  │   │   │   │   └── points: Number
  │   │   │   └── submittedAt: Number
  │   ├── pausedBy: String
  │   ├── pausedAt: Number
  │   └── roundScores: Object
```

## Fehlerbehebung

Wenn Sie auf Probleme stoßen:

1. Stellen Sie sicher, dass alle Abhängigkeiten korrekt installiert sind
2. Überprüfen Sie, ob die Firebase-Konfiguration korrekt ist
3. Löschen Sie den `.cache`-Ordner und den `node_modules`-Ordner und führen Sie `npm install` erneut aus
4. Stellen Sie sicher, dass Ihre Node.js-Version kompatibel ist (v16 oder höher empfohlen)

## Deployment

Die Anwendung kann auf jedem statischen Hosting-Dienst bereitgestellt werden. Nach dem Ausführen von `npm run build` können Sie den Inhalt des `dist`-Verzeichnisses auf Ihren bevorzugten Hosting-Dienst hochladen.

Die Live-Version dieser Anwendung ist unter [https://zgbncfke.manus.space](https://zgbncfke.manus.space) verfügbar.
