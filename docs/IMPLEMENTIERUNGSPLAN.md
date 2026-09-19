> Status September 2026: Stage four replaces the accepted placement target with a
> procedural gold coin. The camera route places it 2.5 metres ahead of the first
> active pose, keeps its logical world anchor fixed, and adds rotation plus gentle
> floating. Physical iPhone validation remains the gate before enabling the beacon;
> see [STAGE-FOUR-TESTING.md](STAGE-FOUR-TESTING.md). The simulated desktop route
> remains available at `?demo=1`.

Implementierungsplan – WebAR Coin Game

1. Ziel

Wir bauen eine vollständig browserbasierte WebAR-Anwendung, die primär auf iOS/Safari und zusätzlich auf Android funktionieren soll.

Der MVP:

1. Nutzer scannt einen QR-Code oder öffnet eine URL.
2. Website öffnet sich direkt im Browser.
3. Nutzer startet die AR-Session und erlaubt Kamerazugriff.
4. Das Gerät wird kurz im Raum bewegt, damit das räumliche Tracking initialisiert werden kann.
5. Eine virtuelle Goldmünze wird im Raum platziert.
6. Ein Beacon zeigt dem Nutzer, wo sich die Münze befindet.
7. Die Münze bleibt während der Bewegung möglichst stabil an ihrer Position.
8. Nutzer läuft zur Münze.
9. Bei ausreichend geringem Abstand wird die Münze eingesammelt.
10. Animation / Sound / Score bestätigen das Einsammeln.

Nicht Teil des ersten MVP:

* Hand Tracking
* Greifen der Münze mit der Hand
* Accounts
* Backend
* Datenbank
* Multiplayer
* persistenter Spielstand
* komplexe Raumrekonstruktion

⸻

2. Technologie-Stack

Anwendung

TypeScript
Vite
Three.js
AlvaAR
WebAssembly
HTML/CSS

Aufgabenverteilung

AlvaAR

Kamerabild
→ Feature Detection
→ Visual SLAM
→ Kamera-Pose

AlvaAR beantwortet also im Wesentlichen:

Wo befindet sich das Smartphone gerade im Raum?

Three.js

Kamera-Pose
→ virtuelle 3D-Kamera
→ Goldmünze
→ Beacon
→ Animationen
→ Rendering

Unsere Game Engine

Tracking State
Coin Position
Player Position
Distance Calculation
Collection Logic
Score
Game State

⸻

3. Hosting

Hosting erfolgt ausschließlich über:

GitHub
+
GitHub Actions
+
GitHub Pages

Kein eigener Server.

Kein Proxmox.

Keine Cloudflare-Infrastruktur.

Kein Backend.

Für ein öffentliches GitHub-Repository kann das vollständig kostenlos betrieben werden.

⸻

4. Repository-Struktur

Geplante Struktur:

web-ar-coin/
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
│
├── public/
│   ├── models/
│   │   └── coin.glb
│   │
│   ├── sounds/
│   │   └── collect.mp3
│   │
│   └── textures/
│
├── src/
│   ├── main.ts
│   │
│   ├── app/
│   │   └── App.ts
│   │
│   ├── tracking/
│   │   ├── TrackingProvider.ts
│   │   └── AlvaTrackingProvider.ts
│   │
│   ├── rendering/
│   │   ├── Renderer.ts
│   │   ├── Scene.ts
│   │   └── Camera.ts
│   │
│   ├── game/
│   │   ├── Game.ts
│   │   ├── Coin.ts
│   │   ├── Beacon.ts
│   │   └── Player.ts
│   │
│   ├── ui/
│   │   ├── StartScreen.ts
│   │   ├── HUD.ts
│   │   └── TrackingStatus.ts
│   │
│   └── utils/
│
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md

Tracking, Rendering und Game Logic bleiben bewusst getrennt.

Dadurch könnten wir AlvaAR später austauschen, ohne das gesamte Spiel neu zu entwickeln.

⸻

5. Git-Workflow für zwei Entwickler

main ist immer der stabile Stand.

Direkte Entwicklung auf main findet nicht statt.

Beispiel:

main
│
├── feature/alva-tracking
│
└── feature/coin-game

Oder:

main
│
├── basti/alva-tracking
│
└── person2/coin-ui

Empfohlen:

feature/<person>-<task>

zum Beispiel:

feature/basti-tracking
feature/max-game-ui
feature/basti-beacon
feature/max-coin-animation

Jede Arbeit wird über Pull Request nach main integriert.

main erhält Branch Protection:

No direct push
Pull Request required
Build muss erfolgreich sein

⸻

6. Deployment-Konzept

GitHub Pages besitzt eine gemeinsame Website für das Repository.

Deshalb werden die verschiedenen Branch-Versionen innerhalb dieser Site unter unterschiedlichen Pfaden abgelegt.

Angenommen Repository:

web-ar-coin

und GitHub-User:

example

Dann ist Production:

https://example.github.io/web-ar-coin/

Branch:

feature/basti-tracking

bekommt automatisch:

https://example.github.io/web-ar-coin/preview/feature-basti-tracking/

Branch:

feature/max-coin-ui

bekommt:

https://example.github.io/web-ar-coin/preview/feature-max-coin-ui/

Damit können auf zwei Smartphones gleichzeitig verschiedene Entwicklungsstände getestet werden.

⸻

7. Automatisches Branch Deployment

Jeder Push löst GitHub Actions aus.

Beispiel:

git push
   ↓
GitHub
   ↓
GitHub Actions
   ↓
npm ci
   ↓
npm run build
   ↓
Branchname bestimmen
   ↓
Build unter Branch-Pfad speichern
   ↓
gesamte Pages-Site deployen

Es gibt dafür intern einen generierten Branch:

pages-content

Dieser Branch wird nicht manuell bearbeitet.

Er enthält nur das bereits gebaute statische Ergebnis.

Beispiel:

pages-content
│
├── index.html                    ← main
├── assets/
│
└── preview/
    │
    ├── feature-basti-tracking/
    │   ├── index.html
    │   └── assets/
    │
    └── feature-max-coin-ui/
        ├── index.html
        └── assets/

GitHub Actions aktualisiert bei einem Push immer nur den relevanten Bereich.

⸻

8. Wichtig: parallele Deployments

Da zwei Entwickler gleichzeitig pushen können, müssen Deployments serialisiert werden.

Sonst könnte folgendes passieren:

Developer A
↓
Deployment A
gleichzeitig
Developer B
↓
Deployment B
→ beide verändern pages-content
→ Race Condition

Deshalb erhält der Deployment-Workflow eine globale GitHub-Actions-Concurrency-Gruppe:

concurrency:
  group: github-pages-deployment
  cancel-in-progress: false

Damit können Builds prinzipiell stattfinden, aber Änderungen an der gemeinsamen Pages-Site werden nacheinander verarbeitet.

Ein Deployment von Entwickler B löscht dadurch nicht versehentlich das Preview von Entwickler A.

⸻

9. Vite Base Paths

Das ist für GitHub Pages besonders wichtig.

Production liegt nicht unter:

/

sondern beispielsweise unter:

/web-ar-coin/

Ein Preview liegt wiederum unter:

/web-ar-coin/preview/feature-basti-tracking/

Deshalb muss Vite pro Build den korrekten base-Pfad erhalten.

Production:

vite build --base=/web-ar-coin/

Preview:

vite build --base=/web-ar-coin/preview/feature-basti-tracking/

Damit funktionieren auch:

JavaScript Bundles
CSS
Textures
GLB Models
WASM
Sounds

korrekt innerhalb der jeweiligen Preview.

Besonders bei AlvaAR/WASM muss darauf geachtet werden, dass Ressourcen nicht hart auf /... zeigen.

Für dynamisch geladene Assets verwenden wir grundsätzlich:

import.meta.env.BASE_URL

oder:

new URL("./asset", import.meta.url)

anstatt feste Root-URLs zu bauen.

⸻

10. Deployment-Workflow

Der Workflow reagiert ungefähr auf:

push auf main
push auf feature/*
Löschen eines Branches

Bei einem normalen Feature-Push:

feature/basti-tracking
        ↓
sanitize
        ↓
feature-basti-tracking
        ↓
Vite build
        ↓
preview/feature-basti-tracking/

Bei einem main-Push:

main
 ↓
Vite build
 ↓
Pages Root

Dabei wird der existierende:

preview/

Ordner nicht gelöscht.

⸻

11. Entfernen alter Branch Deployments

Wenn ein Feature gemerged wurde:

feature/basti-tracking
        ↓
Pull Request
        ↓
main
        ↓
Branch löschen

soll GitHub Actions auch:

/preview/feature-basti-tracking/

entfernen.

Damit sammeln sich nicht über Monate alte Preview-Versionen an.

⸻

12. Phase 1 – Grundprojekt

Ziel:

TypeScript + Vite + Three.js läuft

Aufgaben:

* Repository erstellen
* Node-Projekt erstellen
* TypeScript konfigurieren
* Vite einrichten
* Three.js installieren
* minimale Three.js-Szene
* ESLint/Formatter
* .gitignore
* README
* GitHub Pages aktivieren
* Deployment-Workflow erstellen

Abnahmekriterium:

main
→ GitHub Pages
→ Website öffnet auf iPhone

und:

feature/test
→ eigene Preview-URL

⸻

13. Phase 2 – Kamera

Noch kein AR.

Ziel:

Safari
↓
Start AR
↓
Camera Permission
↓
Live Camera Feed

Wichtig ist ein expliziter Start-Button.

UI:

┌───────────────────────┐
│                       │
│     COIN HUNT         │
│                       │
│     [ START AR ]      │
│                       │
└───────────────────────┘

Nach Tap:

Safari Camera Permission
        ↓
getUserMedia()
        ↓
Camera Stream

Tests:

* iPhone Safari
* Hochformat
* Querformat
* Permission denied
* Kamera erneut erlauben
* Reload
* Display Lock
* Wechsel Safari ↔ andere App

Abnahmekriterium:

Kamera startet zuverlässig über GitHub Pages auf dem iPhone.

⸻

14. Phase 3 – AlvaAR Spike

Das ist der wichtigste technische Meilenstein.

Noch keine Münze und kein eigentliches Spiel.

Pipeline:

Camera
 ↓
reduzierter Tracking Frame
 ↓
AlvaAR
 ↓
Camera Pose
 ↓
Three.js Camera

Tracking-Auflösung zunächst beispielsweise:

640 × 480

Die Rendering-Auflösung darf davon unabhängig höher sein.

UI zeigt Debug-Information:

Tracking: INITIALIZING
Tracking: ACTIVE
Tracking: LOST

Optional:

FPS
Tracking FPS
Pose
Feature Count

Abnahmekriterium:

Eine virtuelle Box kann im Raum platziert werden und bleibt während einer normalen Bewegung überzeugend dort stehen.

⸻

15. Phase 4 – Tracking-Test

Bevor weitere Game Features gebaut werden, wird AlvaAR praktisch getestet.

Testablauf:

1. Tracking starten
2. Objekt platzieren
3. 2 m nach links laufen
4. zurück
5. 3 m nach vorne
6. zurück
7. Objekt umrunden
8. Smartphone kurz wegdrehen
9. zurück auf Objekt
10. Session 60 Sekunden laufen lassen

Wir beobachten:

Initialisierungszeit
FPS
Drift
Tracking Loss
Recovery
Ruckeln
CPU-/Temperaturverhalten

Go:

Tracking ausreichend stabil
→ Game weiterbauen

No-Go:

Tracking unbrauchbar
→ TrackingProvider austauschen

Die Game-Architektur bleibt trotzdem bestehen.

⸻

16. Phase 5 – AR World / Placement

Nach erfolgreichem Tracking:

Tracking startet
      ↓
World Origin definieren
      ↓
Plane / Bodenposition bestimmen
      ↓
Spawn Position festlegen

Für den ersten MVP genügt eine Münze.

Beispielsweise:

User
📱
│
│       2–3 m
│────────────────→ 🪙

Die Münze wird nur einmal positioniert.

Anschließend verändert sich:

Coin Position = konstant

während:

Camera Position = bewegt sich

⸻

17. Phase 6 – Goldmünze

Zunächst kann die Münze sogar ein primitiver Three.js-Zylinder sein.

Danach ersetzen wir ihn durch:

coin.glb

Features:

* Rotation
* leichte Auf-/Ab-Bewegung
* Material
* Beleuchtung
* optional Glow
* optional Particles

Das Objekt selbst muss performant bleiben.

⸻

18. Phase 7 – Beacon

Die Coin muss auch gefunden werden können, wenn sie gerade nicht im Kameraausschnitt liegt.

Deshalb bekommt sie einen Beacon.

Beispiel:

        ✦
        │
        │
        │
        │
       🪙
────────────────

Zusätzlich kann die UI später anzeigen:

COIN
2.4 m
↑

Beacon V1:

* vertikaler Beam
* leicht animiert
* transparent
* große Sichtweite

⸻

19. Phase 8 – Player Position

Bei World Tracking entspricht die Kamera näherungsweise der Spielerposition.

playerPosition = cameraPosition

Damit berechnen wir:

distance =
distance(playerPosition, coinPosition)

Debug HUD:

Coin distance: 2.43 m

Damit lässt sich die Tracking-Qualität gleichzeitig gut überprüfen.

⸻

20. Phase 9 – Collection Logic

Für den MVP:

distance < threshold

beispielsweise:

50–70 cm

führt zu:

collectCoin()

Ablauf:

Player approaches coin
        ↓
distance < 0.6m
        ↓
Coin collection triggered
        ↓
animation
        ↓
sound
        ↓
coin disappears
        ↓
score++

HUD:

COINS
1 / 1

⸻

21. Phase 10 – Spielzustände

Wir definieren explizite States:

LOADING
↓
READY
↓
REQUEST_CAMERA
↓
INITIALIZING_TRACKING
↓
PLAYING
↓
COIN_COLLECTED
↓
FINISHED

Dadurch vermeiden wir später viele UI- und State-Probleme.

⸻

22. Phase 11 – iOS UX

Da iOS Must-have ist, wird iPhone nicht als sekundäre Plattform behandelt.

Die Entwicklung erfolgt grundsätzlich:

Desktop Dev Tools
+
echtes iPhone

Nach jedem größeren Feature erfolgt ein iPhone-Test.

Besonders prüfen:

* Safari
* Kamera Permission
* Screen orientation
* Safe Area / Notch
* Touch
* Vollbildwirkung
* Browser UI
* Resume nach App-Wechsel
* Kamera-Neustart
* Performance
* thermische Belastung
* unterschiedliches Licht
* Tracking auf verschiedenen Böden
* ältere iPhones, falls verfügbar

⸻

23. Gemeinsames Tracking-Interface

Die Game Logic kennt AlvaAR nicht direkt.

Stattdessen:

interface TrackingProvider {
    start(): Promise<void>;
    stop(): void;
    getPose(): CameraPose | null;
    getState(): TrackingState;
}

Aktuell:

TrackingProvider
      ↑
AlvaTrackingProvider

Später theoretisch:

TrackingProvider
      ↑
├── AlvaTrackingProvider
├── WebXRTrackingProvider
└── OtherTrackingProvider

Das reduziert das technische Risiko erheblich.

⸻

24. Zusammenarbeit der beiden Entwickler

Empfohlene erste Aufteilung:

Entwickler A – Tracking

Camera
AlvaAR
Pose
Three.js Camera
Tracking Debug
Performance

Branch:

feature/a-tracking

Preview:

.../preview/feature-a-tracking/

Entwickler B – Game / Rendering

Three.js Scene
Coin
Beacon
HUD
Game State
Collection Logic

Branch:

feature/b-game

Preview:

.../preview/feature-b-game/

Damit arbeiten beide weitgehend unabhängig.

Danach:

feature/a-tracking
        \
         → main
        /
feature/b-game

Integration erfolgt über klar definierte Interfaces.

⸻

25. Pull-Request-Prozess

Vor einem Merge:

npm install
npm run build
npm run lint

GitHub Actions führt mindestens aus:

TypeScript Check
Lint
Build

Nur erfolgreicher Build darf nach main.

Dann:

PR approved
↓
merge
↓
main build
↓
production deployment

Production ist damit immer der letzte erfolgreiche main-Stand.

⸻

26. Entwicklungsreihenfolge

Die Reihenfolge ist bewusst risikoorientiert.

1 Git/Vite/Three.js
        ↓
2 Branch Deployments
        ↓
3 iPhone Camera
        ↓
4 AlvaAR
        ↓
5 stabile Pose
        ↓
6 fester Cube
        ↓
7 Tracking-Test
        ↓
──────── GO / NO-GO ────────
        ↓
8 Coin
        ↓
9 Positioning
        ↓
10 Beacon
        ↓
11 Distance
        ↓
12 Collection
        ↓
13 Animation/Sound
        ↓
14 UX/Performance

Wir investieren damit möglichst wenig Arbeit in Game Features, bevor bewiesen ist, dass AlvaAR auf unseren Ziel-iPhones ausreichend funktioniert.

⸻

27. MVP Definition of Done

Der MVP gilt als fertig, wenn:

✓ QR-Code / URL öffnet Website
✓ funktioniert in Safari auf iPhone
✓ keine App-Installation
✓ Kamera startet
✓ Tracking initialisiert
✓ Münze erscheint im realen Raum
✓ Münze bleibt ausreichend stabil
✓ Beacon ist sichtbar
✓ User kann zur Münze laufen
✓ Distanz wird erkannt
✓ Münze kann eingesammelt werden
✓ visuelles Feedback
✓ Sound
✓ Score
✓ Session kann neu gestartet werden
✓ main hat Production Deployment
✓ jeder Feature-Branch hat eigene Preview-URL
✓ zwei Entwickler können gleichzeitig deployen
✓ Branch-Deployments überschreiben sich nicht

⸻

28. Zielarchitektur

                    GitHub Repository
                           │
             ┌─────────────┴─────────────┐
             │                           │
      Developer A                  Developer B
             │                           │
 feature/a-tracking              feature/b-game
             │                           │
             └──────── Git Push ─────────┘
                           │
                           ▼
                    GitHub Actions
                           │
                     Vite Build
                           │
             ┌─────────────┴─────────────┐
             │                           │
           main                       feature
             │                           │
             ▼                           ▼
        Pages Root              /preview/<branch>/
             │                           │
             └─────────────┬─────────────┘
                           ▼
                     GitHub Pages
                           │
                           ▼
                        iPhone
                           │
                          URL
                           │
                           ▼
                     Safari + HTTPS
                           │
                           ▼
                        Camera
                           │
                           ▼
                         AlvaAR
                           │
                           ▼
                     Camera Pose
                           │
                           ▼
                       Three.js
                           │
                ┌──────────┼─────────┐
                ▼          ▼         ▼
              Coin       Beacon     HUD
                │
                ▼
             Game Logic
                │
                ▼
         distance < threshold
                │
                ▼
           COIN COLLECTED

Erster Meilenstein

Der erste wirkliche Projekt-Meilenstein lautet nicht:

„Goldmünze funktioniert.“

Sondern:

Zwei Branches können unabhängig deployed werden, eine GitHub-Pages-URL öffnet auf einem echten iPhone die Kamera, AlvaAR berechnet eine stabile Pose und ein Three.js-Testobjekt bleibt beim Herumlaufen überzeugend an einer Position im Raum.

Erst wenn dieser Meilenstein erreicht ist, beginnen wir mit dem eigentlichen Coin Game.
