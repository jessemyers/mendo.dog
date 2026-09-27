# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

mendo.dog is a community website about having dogs in Mendocino, CA. Its main use is as a trail map. It is a Vite + React 19 single-page app in TypeScript, using Material UI v9 (with Emotion), React Router v8, and MapLibre GL JS v6. It is a PWA with offline map support. It is deployed on Netlify.

## Commands

Uses Yarn 4 (pinned via `packageManager` in `package.json`; run through corepack) with `nodeLinker: node-modules`. Node 24 (`.nvmrc`, and `NODE_VERSION` in `netlify.toml`).

- `yarn start` — Vite dev server
- `yarn build` — type-check with `tsc`, then `vite build` to `build/` (Netlify runs this and publishes `build/`)
- `yarn preview` — serve the production build locally. The service worker only runs in the production build, so test offline behavior here, not with `yarn start`.
- `yarn lint` — `prettier --check src` then `eslint --cache src`
- `yarn format` — `prettier --write src` then `eslint --cache --fix src`

There are no tests and no `test` script yet.

## Configuration

- No API keys or env vars are needed. All map data sources are free and keyless.
- ESLint uses flat config (`eslint.config.js`): `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`. Prettier uses default settings.
- TypeScript is pinned to `~6.0` because `typescript-eslint` does not yet support TypeScript 6.1+/7.

## Architecture

- `index.html` (repo root, as Vite requires) loads `src/index.tsx`, which mounts `App` in `React.StrictMode`. Static files (icons, `manifest.json`) are in `public/`.
- `src/App.tsx` defines all routes with `createBrowserRouter` (imported from `react-router`) and applies MUI `CssBaseline`. New pages go in `src/pages/` and get a route here.
- Routes: `/` → `pages/Home.tsx` (the trail map), `/about` → `pages/About.tsx` (intro text; its component function is misnamed `Home`).
- `Home.tsx` creates the MapLibre map in a `useEffect` with cleanup (StrictMode runs effects twice in dev). It calls `setWorkerUrl` with a `?worker&url` import because MapLibre 6 loads its worker by URL; `vite.config.ts` sets `worker.format: "es"` for it.
- MUI v9 removed system style props on `Box` (e.g. `margin={1}`); put styles in `sx`.
- `netlify.toml` has no SPA redirect rule, so a direct load of a client-side route like `/about` may 404 on Netlify.

### Map style and data sources

- `src/map/style.ts` fetches the OpenGIS "outdoors" style (github.com/OpenGIS/outdoors) from jsDelivr, pinned to a commit. It is loaded at runtime, not copied into the repo, because that repo has no license. At load time it removes the Esri satellite layer and 3D terrain.
- Sources in that style: OpenFreeMap base tiles (source id `openmaptiles`, max zoom 14, all trails from zoom 14), plus OpenGIS extras from `tile.ogis.app` (trails at zoom 9–13, contours, POIs) and Mapterhorn elevation (hillshade). Contours are metric only.

### Offline

- Only OpenFreeMap tiles are saved for offline use. Its owner confirmed the public instance has no usage restrictions. `tile.ogis.app` and Mapterhorn have no stated usage policy, so they stay online only: do not prefetch or cache them.
- `src/sw.ts` (Workbox, built by `vite-plugin-pwa` in `injectManifest` mode) precaches the app, caches the style/sprites/fonts, and serves OpenFreeMap tiles stale-while-revalidate. Tile cache keys drop the version segment (`/planet/<version>/z/x/y.pbf` → `/planet/z/x/y.pbf`) so saved tiles still match after OpenFreeMap publishes a new version (about weekly).
- "Save area" (`src/components/SaveAreaButton.tsx`, `src/map/offline.ts`) fetches every base tile for the visible bounds at zooms 10–14, plus label font ranges, through the service worker, which stores them. Zooms above 14 reuse zoom 14 tiles.
