# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

mendo.dog is a community website about having dogs in Mendocino, CA. Its main use is as a trail map. It is a Vite + React 19 single-page app in TypeScript, using Material UI v9 (with Emotion), React Router v8, and Mapbox GL JS v3. It is deployed on Netlify.

## Commands

Uses Yarn 4 (pinned via `packageManager` in `package.json`; run through corepack) with `nodeLinker: node-modules`. Node 24 (`.nvmrc`, and `NODE_VERSION` in `netlify.toml`).

- `yarn start` — Vite dev server
- `yarn build` — type-check with `tsc`, then `vite build` to `build/` (Netlify runs this and publishes `build/`)
- `yarn preview` — serve the production build locally
- `yarn lint` — `prettier --check src` then `eslint --cache src`
- `yarn format` — `prettier --write src` then `eslint --cache --fix src`

There are no tests and no `test` script yet.

## Configuration

- `REACT_APP_MAPBOX_TOKEN` must be set (in `.env` locally, and in Netlify's environment for deploys). The old CRA name is kept on purpose: `vite.config.ts` sets `envPrefix: "REACT_APP_"`, and code reads it as `import.meta.env.REACT_APP_MAPBOX_TOKEN` (typed in `src/vite-env.d.ts`). All `.env*` files are git-ignored.
- ESLint uses flat config (`eslint.config.js`): `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`. Prettier uses default settings.
- TypeScript is pinned to `~6.0` because `typescript-eslint` does not yet support TypeScript 6.1+/7.

## Architecture

- `index.html` (repo root, as Vite requires) loads `src/index.tsx`, which mounts `App` in `React.StrictMode`. Static files (icons, `manifest.json`) are in `public/`.
- `src/App.tsx` defines all routes with `createBrowserRouter` (imported from `react-router`) and applies MUI `CssBaseline`. New pages go in `src/pages/` and get a route here.
- Routes: `/` → `pages/Home.tsx` (the Mapbox map), `/about` → `pages/About.tsx` (intro text; its component function is misnamed `Home`).
- The map in `Home.tsx` uses the Mapbox `outdoors-v12` style, centered on Mendocino, with navigation and geolocate (high accuracy, tracking) controls. It is created imperatively in a `useEffect` and kept in a `useRef` so it is only initialized once (this guard matters because StrictMode runs effects twice in dev).
- MUI v9 removed system style props on `Box` (e.g. `margin={1}`); put styles in `sx`.
- `netlify.toml` has no SPA redirect rule, so a direct load of a client-side route like `/about` may 404 on Netlify.
