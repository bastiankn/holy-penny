# Stage one: setup and testing

Stage one proves startup, camera display, rendering and deployment. It does not
prove world tracking. Expect **SIMULATED** in the HUD and a distance in **demo units**.
The rotating coin and its vertical beacon stay in the same area of the screen
when you move the phone. Physical movement cannot collect the coin yet.

## 1. Test locally first

From the repository folder:

```bash
cd /home/bastian/Documents/Projects/holy-penny
npm ci
npm run dev
```

1. Open http://localhost:3000/ in Chrome, Firefox or Safari.
2. Click **Try without a camera**, then **START DESKTOP DEMO**.
3. Confirm a rotating gold coin and translucent vertical beacon are visible.
4. Confirm the bottom overlay says **SIMULATED** and shows a build ID.
5. Resize the browser between a narrow portrait shape and a wide landscape shape.
   The graphics should remain visible and maintain their proportions.
6. Reload the original URL, press **START CAMERA DEMO**, and allow camera access.
   On a desktop without a camera, use the desktop demo instead.
7. Confirm the camera fills the viewport behind the coin. Cropping at the edges
   is expected (`object-fit: cover`); stretching or black borders are not.
8. In the browser's site settings, deny camera permission, then reload and start.
   Expect a readable error, an enabled retry button, and a working desktop-demo link.
   Re-enable camera permission in site settings and retry.

Stop the server with **Ctrl+C**. If port 3000 is occupied, stop the other server
or use `npm run dev -- --port 3001`, then use that port in the URL.

## 2. Run automated checks (optional for manual testers)

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:browser
```

On Linux, if browser launch reports missing system libraries:

```bash
npx playwright install --with-deps chromium
```

The browser test uses a generated camera, verifies visible gold pixels, checks
portrait and landscape sizing, and exercises denied camera access. Its failures
save screenshots/traces under `test-results/`. Real Three.js tests also verify
both meshes enter the scene and are disposed. Deployment tests simulate main,
two previews, updates and deletion, checking that unrelated content survives.

## 3. One-time GitHub setup and initial rollout

A repository administrator may need to perform the settings steps.

1. In GitHub **Settings → Pages → Build and deployment**, select **GitHub Actions**.
2. In **Settings → Environments → github-pages**, allow deployments from `main`,
   `feature/*`, and `codex/*` (and patterns for any deeper branch names you use).
   If the environment allows only the protected main branch, previews will wait
   or be rejected. Keep any required reviewer policy you want.
3. Ensure Actions can write repository contents. The deployment job explicitly
   requests `contents: write` for the generated `pages-content` branch.
   Repository/organization rules must permit that bot push.
4. Push the prepared branch:

   ```bash
   git push -u origin codex/stage-one
   ```

5. Open a pull request into `main`. Confirm **CI / checks** passes and review it.
   The first feature deployment may report that production is not initialized;
   this is an intentional guard against replacing production with a preview.
6. Merge the pull request. Its **main** deployment initializes `pages-content`
   and publishes the combined site. Do not manually create that branch.
7. Open **Actions → Deploy to GitHub Pages → the successful main run** and use
   the **Test URL** in its summary. Production is
   https://bastiankn.github.io/holy-penny/.
8. Add branch protection/rules for `main`: require a pull request and the `checks`
   status. Do not require the publishing job to pass before a PR can merge.
9. Update any existing development branches from the new main before pushing them,
   so they also use the preserving deployment workflow. An old branch still
   carrying the previous workflow could replace the shared site.

No remote push, merge, settings change or live deployment is performed by the
local implementation alone.

## 4. Test on your iPhone

1. Open the deployed **HTTPS** URL directly in **Safari**. A phone's `localhost`
   means the phone itself, not your computer. Avoid an embedded messenger browser.
2. Check the build ID against the deployed commit shown in the Actions summary.
3. Tap **START CAMERA DEMO** and allow access to the camera.
4. Confirm the rear camera feed, rotating coin, vertical beacon, score and
   **SIMULATED** label are visible.
5. Turn the phone to landscape and back. The camera should cover the screen
   without stretching, and buttons should stay tappable.
6. Reload, then repeat the start. Also check the desktop demo link on the phone.
7. Test denied permission and retry after allowing access again in Safari's
   website settings. Record any failures rather than assuming a UI-only pass
   proves physical tracking.

When reporting a problem, include:

- iPhone model and iOS version;
- URL and build ID;
- steps you took and expected versus actual result;
- screenshot or a short recording if the issue is visual.

App switching, lock/unlock, audio unlocking and tracking recovery receive fuller
coverage in later stages; note any problems you encounter now.

## 5. Verify feature preview isolation after initial rollout

1. Keep `codex/stage-one` on GitHub until this check is complete. Once the workflow
   exists on main, go to **Actions → Deploy to GitHub Pages → Run workflow**, select
   `codex/stage-one`, and run it again. The summary gives its hashed preview URL.
2. Create a second feature branch from updated main, push it, and take its URL
   from that successful run's summary.
3. Confirm production and both preview URLs load. A deployment must not make any
   of the other URLs disappear.
4. Delete the second test branch on GitHub. After the delete deployment finishes,
   only its preview should return 404; production and the first preview remain.

Preview names contain a short hash to prevent collisions such as `feature/a-b`
and `feature/a/b`. To calculate one locally:

```bash
node scripts/pages.mjs target codex/stage-one bastiankn/holy-penny
```

Do not use a feature preview URL before its workflow succeeds. If a deployment
fails, inspect the failed step in Actions; after fixing the cause, rerun it.
