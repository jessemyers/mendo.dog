import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Keep the CRA-era env var name (REACT_APP_MAPBOX_TOKEN) so .env and Netlify settings still work.
  envPrefix: "REACT_APP_",
  build: {
    outDir: "build",
  },
});
