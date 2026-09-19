# Stage 3: AR world placement

Stage 3 keeps the real AlvaAR camera pipeline from Stage 2 and replaces the
five-metre tracking cube with a neutral placement target. The target is placed
once from the first active pose, 2.5 metres ahead and 0.5 metres below the
camera. Later camera poses move only the Three.js camera; they never reposition
the target.

This stage deliberately does not enable the coin, beacon, distance, or
collection loop on the camera route. `?demo=1` still runs the simulated game.
AlvaAR does not provide plane detection, so this version uses a deterministic
height offset rather than claiming that it detected the floor.

## Automated checks

Use Node.js 22 LTS:

```bash
npm ci
npm run check
npm run build
npm run test:browser
```

The existing ARWorld tests verify yaw-relative 2–3 metre placement, one-time
placement, immutable stored positions, reset behavior, and defensive copies.
The browser checks verify the complete build, real WebGL rendering, camera
permission handling, the pinned AlvaAR runtime, and the renamed placement flow.
Synthetic camera video still cannot prove physical world stability.

## Local browser check

Run `npm run dev`, open http://localhost:3000/, and select **START AR
PLACEMENT**. Point the camera at a well-lit area with visible texture and move
slowly sideways in a shallow arc.

Expected behavior:

1. The overlay starts at `Tracking: INITIALIZING`.
2. When tracking becomes active, a cyan ring with a multicolored center appears.
3. The guide says that the target was placed 2.5 metres ahead.
4. Moving after placement changes the view of the target but not its world position.
5. The target disappears while tracking is lost and returns in the same world
   position when tracking recovers.

## iPhone acceptance test

Use the HTTPS preview URL from the Stage 3 GitHub Actions deployment summary.

1. Open the preview in Safari and select **START AR PLACEMENT**.
2. Point at a textured wall/floor junction or furniture and move slowly until
   tracking becomes `ACTIVE`.
3. Confirm the target appears once, approximately 2.5 metres ahead.
4. Walk about 2 metres left and back. The target must stay attached to its
   original world position rather than following the center of the camera.
5. Walk toward the target, stop before reaching it, and then walk backward.
   Its apparent size should change naturally with distance.
6. Walk partway around it and verify that it remains in the same location.
7. Turn toward a blank wall until tracking becomes `LOST`; the target should
   disappear. Return to the previous view and confirm it reappears at the same spot.
8. Run for 60 seconds and record drift, recovery, frame rate, heat, and battery use.
9. Reload once in portrait and once in landscape. Do not rotate midway through
   this spike without reloading because the tracking buffer uses the initial layout.

Record the phone model, iOS and Safari versions, time to first placement, whether
the target ever followed the camera, estimated drift, tracking-loss recovery, and
whether the 2.5 metre distance felt usable.
