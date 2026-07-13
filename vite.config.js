// vite.config.js (at repo root)
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: {
        // index: resolve(__dirname, "packages/index.js"), // optional barrel
        analytics: resolve(__dirname, "packages/core-analytics/src/index.js"),
        "session-replay": resolve(__dirname, "packages/session-replay/src/index.js"),
        player: resolve(__dirname, "packages/player/src/index.js"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      external: [] // keep empty so utils/* gets bundled into each entry
    }
  }
});