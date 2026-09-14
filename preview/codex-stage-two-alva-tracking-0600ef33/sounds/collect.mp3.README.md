# collect.mp3 — coin collect sound effect

Drop the collect sound file here as `collect.mp3` (this directory:
`public/sounds/collect.mp3`). The `.gitkeep` placeholder keeps the folder in
git; no binary is committed.

## Format

- Container/codec: MP3 (MPEG Layer III), `.mp3` extension
- Mix: mono or stereo, 44.1 kHz recommended
- Length: short effect, ideally < 1 s
- Size: keep it small (< 100 KB) — it is fetched at runtime on first collect
- Loudness: normalized, no clipping; the WebAudio fallback beep plays at
  880 Hz / 0.2 gain for reference

## Runtime URL

`SoundPlayer` builds the URL as `baseUrl + 'sounds/collect.mp3'`, where
`baseUrl` is passed from app code (`App` derives it from
`document.baseURI`, which reflects `import.meta.env.BASE_URL` / the Vite
`base` option at runtime). Examples:

- dev server (`/`): `/sounds/collect.mp3`
- GitHub Pages (`/holy-penny/`): `/holy-penny/sounds/collect.mp3`

Vite copies everything under `public/` to the build output root, so placing
the file here is all that is needed — no import required.

## Fallback chain (see `src/utils/sound.ts`)

1. `fetch(url)` succeeds + `Audio` element plays → `'file'`
2. otherwise an `AudioContext` oscillator beep → `'webaudio'`
3. otherwise silent → `'silent'`

`playCollect()` never throws and never autoplays before a user gesture
(no `Audio` nodes are created until it is called from gameplay).

## Licensing

Use a sound you have the rights to (record your own, or use a CC0 asset
such as those from freesound.org / OpenGameArt with attribution noted
here if required).
