# coin.glb — placement guide

This directory (`public/models/`) holds the optional `coin.glb` model used by
`src/game/Coin.ts`. No binary is committed; drop the exported file here:

```
public/models/coin.glb
```

Vite serves everything under `public/` at the app root, so after `vite build`
the model is available at `<base>/models/coin.glb`.

## Runtime URL

`Coin` defaults `glbUrl` to the app base path plus `models/coin.glb`. In a Vite
build that base is `import.meta.env.BASE_URL` (e.g. `/holy-penny/` in
production, `/holy-penny/preview/<branch>/` for branch previews), so the model
resolves correctly under every deployment path — never hard-code a root URL.
To override, pass an explicit URL:

```ts
const coin = new Coin(scene, { glbUrl: '<base>/models/coin.glb' });
```

If the GLB is missing or fails to load, `Coin` keeps its procedural fallback
mesh (spinning cylinder), so the game stays playable.

## Export checklist (Blender)

- **Y-up**, forward facing +Z; coin standing upright in its local origin.
- Center the pivot at the coin center.
- **≤ 50k triangles** (a coin should be far below this; keep it light for iOS).
- Apply transforms (Ctrl+A → All Transforms) before export.
- Bake the material to simple PBR (Base Color + Metallic/Roughness); avoid
  custom shaders — they do not survive glTF export.
- glTF format: Binary (`.glb`), include materials, compress textures (≤ 1k).
- Test load via the preview deployment before merging.
