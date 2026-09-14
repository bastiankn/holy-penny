# Stage 2: AlvaAR tracking test

Stage 2 replaces the camera route's fixed simulation pose with the real AlvaAR
camera-frame → visual SLAM → Three.js camera pipeline. It deliberately shows a
plain multicolored cube instead of running the coin game. The `?demo=1` route
remains a simulated desktop check.

## Automated checks

Use Node.js 22 LTS:

```bash
npm ci
npm run check
npm run build
npm run test:browser
```

The unit tests inject a deterministic Alva runtime and cover pose conversion,
frame cropping, the 30 FPS processing cap, `INITIALIZING → ACTIVE → LOST → ACTIVE`,
cleanup, and initialization errors. The browser test loads the actual pinned
AlvaAR/WASM runtime with a synthetic camera. Synthetic video cannot prove SLAM or
world stability, so the acceptance decision still requires a physical phone.

## Local browser check

Run `npm run dev`, open http://localhost:3000/, and select **START AR TRACKING**.
Localhost is permitted to use the camera. Point the camera at a well-lit area with
edges and texture, then move it slowly sideways in a small arc.

Expected behavior:

1. The camera fills the screen without stretching.
2. The overlay initially says `Tracking: INITIALIZING` and reports feature count/FPS.
3. Once tracking succeeds, it says `Tracking: ACTIVE` and a multicolored cube appears.
4. If the view loses useful detail, it says `Tracking: LOST` without inventing a pose.
5. Returning to a familiar view can recover `Tracking: ACTIVE`.

## iPhone acceptance test

Use the HTTPS preview URL recorded in the GitHub Actions deployment summary for
the Stage 2 branch. Safari camera access normally requires HTTPS on a phone.

1. Open the preview in Safari while holding the phone in portrait orientation.
2. Select **START AR TRACKING** and allow camera access.
3. Point at a well-lit, textured wall/floor junction or furniture. Avoid a blank wall.
4. Move slowly sideways and in a shallow arc until the state becomes `ACTIVE`.
5. Keep the cube in view, walk roughly 2 m left and back, then 3 m forward and back.
6. Walk partway around the cube. It should remain convincingly attached to one place.
7. Turn away briefly, return to the same view, and confirm tracking recovers.
8. Leave the session running for 60 seconds and note drift, stutter, heat, and battery use.
9. Reload in landscape orientation and repeat. The reduced tracking buffer is selected
   from the initial orientation, so reload after changing orientation for this spike.
10. Deny camera permission once and confirm the retry button and desktop-demo link remain usable.

Record the phone model, iOS version, Safari version, time to first `ACTIVE`, typical
tracking FPS/features, any losses, recovery result, and whether the cube visibly drifts.

Stage 2 passes only after the physical-device result is acceptable. Automated tests
prove the data path and failure handling, not tracking quality in a real room.
