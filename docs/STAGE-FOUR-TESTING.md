# Stage 4: Gold coin

Stage 4 replaces the neutral placement target with a lightweight procedural gold
coin. The coin is placed once, 2.5 metres ahead and 0.5 metres below the first
active camera pose. It faces the placement camera, rotates around its vertical
axis, and moves gently up and down while its logical world position stays fixed.

The camera route still keeps beacon, distance, collection, score, and sound
disabled. Those behaviors remain available only in the simulated `?demo=1` route
until their own stages are enabled.

## Automated checks

Use Node.js 22 LTS:

```bash
npm ci
npm run check
npm run build
npm run test:browser
```

The tests verify one-time placement, camera-relative coin orientation, animation
updates, stable logical coordinates, tracking-loss visibility, session reset, and
the existing rendering and deployment paths. Synthetic browser video cannot prove
world stability, lighting quality, or smooth animation on an iPhone.

## Local browser check

Run `npm run dev`, open http://localhost:3000/, and select **START AR COIN**.
Point the camera at a textured, well-lit area and move slowly until tracking is
active.

Expected behavior:

1. A gold coin appears once, approximately 2.5 metres ahead.
2. The coin rotates continuously and floats gently without changing its logical anchor.
3. Walking around it changes the viewing angle while the coin stays in one world position.
4. The coin disappears during `Tracking: LOST` and returns at the same position.
5. Walking into the coin does not collect it during this stage.

## iPhone acceptance test

Use the HTTPS preview URL from the Stage 4 GitHub Actions deployment summary.

1. Open the preview in Safari and select **START AR COIN**.
2. Move slowly around a textured area until tracking becomes `ACTIVE`.
3. Confirm the coin appears once and is large enough to identify at 2.5 metres.
4. Watch for at least ten seconds. Rotation and floating should remain smooth,
   with no sudden jumps in the world position.
5. Walk about 2 metres left and back, then approach the coin and retreat. It
   should remain fixed and scale naturally with distance.
6. Walk partway around it and confirm the material remains visible from different angles.
7. Force tracking loss by facing a blank surface. The coin should disappear and
   return at the same location after tracking recovers.
8. Walk through the coin and confirm it remains present; collection is a later stage.
9. Run for 60 seconds and record drift, animation smoothness, heat, and battery use.
10. Reload separately in portrait and landscape and repeat the placement.

Record the phone model, iOS and Safari versions, placement time, visibility,
animation smoothness, estimated drift, recovery behavior, and thermal impact.
