# Holy Penny - WebAR Coin Game

A browser-based augmented reality coin collection game built with TypeScript, Vite, and Three.js.

## Overview

Holy Penny is a WebAR game where users can:
- Scan a QR code or open a URL to start
- Use their phone's camera to view AR content
- Find and collect virtual coins in their environment
- Experience immersive AR gameplay without installing an app

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Opens the development server at `http://localhost:3000`

### Build

```bash
npm run build
```

Builds the production-ready files in the `dist/` directory.

### Preview

```bash
npm run preview
```

Previews the built production files locally.

### Lint

```bash
npm run lint
```

Runs ESLint to check for code issues.

```bash
npm run lint:fix
```

Automatically fixes lint issues where possible.

### Format

```bash
npm run format
```

Formats all TypeScript files using Prettier.

## Project Structure

```
.
├── public/                    # Static assets
│   ├── models/               # 3D models
│   ├── sounds/               # Sound files
│   └── textures/             # Texture files
├── src/
│   ├── app/                  # Main application
│   │   └── App.ts
│   ├── tracking/             # AR tracking providers
│   │   ├── TrackingProvider.ts
│   │   └── AlvaTrackingProvider.ts
│   ├── rendering/            # Rendering components
│   │   ├── Renderer.ts
│   │   ├── Scene.ts
│   │   └── Camera.ts
│   ├── game/                 # Game logic
│   │   ├── Game.ts
│   │   ├── Coin.ts
│   │   ├── Beacon.ts
│   │   └── Player.ts
│   ├── ui/                   # User interface
│   │   ├── StartScreen.ts
│   │   ├── HUD.ts
│   │   └── TrackingStatus.ts
│   ├── utils/                # Utility functions
│   ├── main.ts               # Entry point
│   └── vite-env.d.ts         # Vite environment types
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # GitHub Pages deployment
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Technology Stack

- **Language**: TypeScript
- **Build Tool**: Vite
- **3D Rendering**: Three.js
- **AR Tracking**: AlvaAR (planned)
- **Hosting**: GitHub Pages

## Deployment

The project is automatically deployed to GitHub Pages on every push:

- **Main branch**: `https://samis0707.github.io/holy-penny/`
- **Feature branches**: `https://samis0707.github.io/holy-penny/preview/<branch-name>/`

## Git Workflow

1. Create a feature branch: `git checkout -b feature/<name>-<task>`
2. Make your changes
3. Commit and push: `git push origin feature/<name>-<task>`
4. Create a Pull Request to `main`
5. After merge, delete the feature branch

## License

MIT
