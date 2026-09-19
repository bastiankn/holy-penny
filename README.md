# Holy Penny

A browser-based coin game built with TypeScript, Vite and Three.js.

**Current milestone: Stage 4 gold coin.** The camera route sends a
reduced-resolution video frame through the pinned AlvaAR runtime, applies real poses
to the Three.js camera, and places an animated procedural gold coin once, 2.5 metres
ahead of the first active pose. The coin rotates and floats while its world anchor
stays fixed. Beacon and collection remain paused on this route until the coin passes
physical iPhone testing; `?demo=1` remains the explicitly simulated desktop demo.

## Run locally

Use Node.js 22 LTS (the version used in CI) and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000/ and select **START AR COIN**, or choose
**Try without a camera** for the desktop demo. The direct desktop URL is
http://localhost:3000/?demo=1.

Localhost supports camera access without certificates. A phone opening your
computer's LAN IP over HTTP does **not** have the same exception; use the HTTPS
GitHub Pages site for phone testing. The development server binds only to loopback.

## Checks and production build

```bash
npm run check
npm run build
npm run preview
```

`check` runs TypeScript (app and tool configs), ESLint, Jest and deployment tests.
The default build is served at http://localhost:4173/holy-penny/ by the preview server.

Browser checks exercise the **built** site, including a visible-pixel assertion,
camera permission handling, and portrait/landscape layouts:

```bash
npx playwright install chromium
npm run build
npm run test:browser
```

On Linux CI, use `npx playwright install --with-deps chromium` to install required
system libraries too. To exercise a nested preview path:

```bash
BASE_PATH=/holy-penny/preview/local-check/ npm run build
TEST_BASE_PATH=/holy-penny/preview/local-check/ npm run test:browser
```

CI runs these browser checks under Chromium with a generated camera feed. It does
not replace testing Safari and a real camera on an iPhone.

## Deployment

See the [Stage 4 phone checklist](docs/STAGE-FOUR-TESTING.md) for the current gold
coin acceptance test. The [Stage 3 checklist](docs/STAGE-THREE-TESTING.md) remains
the world-placement reference, and the earlier checklists remain the tracking,
camera, and deployment references.

- Production: https://bastiankn.github.io/holy-penny/
- Feature previews: `/holy-penny/preview/<readable-branch>-<hash>/`
- Supported branches: `main`, `feature/**`, `codex/**`.
- Every successful deployment records its URL and commit in the Actions summary.
- Every demo displays its build commit. Local builds show `<commit>-local` when Git is available, otherwise `local`.
- The generated `pages-content` branch stores production and every preview.
  Each update changes only its own directory; main updates preserve previews.
- Branch deletion removes only that preview and republishes the combined site.
- Deployments queue serially, including waiting runs, to prevent lost updates.
- The first deployment must run on **main** to initialize production. A feature
  deployment without stored production fails safely before publishing anything.

Only push, delete and manual deployment events can publish. Pull requests run
read-only checks. Configure branch protection to require the `checks` job.
Do not edit `pages-content` manually.

## Code map

- `src/app/App.ts`: session setup, camera background, scene, UI and game wiring.
- `src/tracking/CameraSource.ts`: camera permission and video playback.
- `src/tracking/SimulationTrackingProvider.ts`: explicit desktop fixed pose.
- `src/tracking/AlvaTrackingProvider.ts`: camera frames, AlvaAR runtime, poses and state transitions.
- `src/rendering/WorldCoinPlacement.ts`: one-time tracked coin placement and visibility.
- `src/rendering/CameraBackground.ts`: screen-aligned video behind transparent WebGL.
- `src/rendering/ARWorld.ts`: placement math.
- `src/game/`: coin, beacon, player and collection state.
- `src/ui/`: start screen, HUD, simulation status and build ID.
- `scripts/pages.mjs`: preview paths and preservation of shared Pages content.
- `tests/browser/`: tests of the built site with real WebGL in Chromium.

Both routes use the procedural coin and do not request the absent optional GLB.
A custom model can be enabled with `CoinOptions.glbUrl`; see `public/models/`.
The optional collect sound is also not included yet; see `public/sounds/`.
The original longer-term roadmap is in [IMPLEMENTIERUNGSPLAN.md](docs/IMPLEMENTIERUNGSPLAN.md).

## License

Holy Penny's original code is MIT. The vendored AlvaAR runtime is GPL-3.0 and has
separate license and source-provenance files. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
before distributing a build that includes it.
