import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Service worker (src/sw.ts) that makes the app installable and serves saved map tiles offline.
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      // public/manifest.json is used as is.
      manifest: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,json}"],
        // MapLibre makes the main bundle larger than Workbox's 2 MB default.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  // MapLibre starts its worker as an ES module.
  worker: {
    format: "es",
  },
  build: {
    outDir: "build",
  },
});
