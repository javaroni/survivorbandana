// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Only import replit plugins if they exist (avoid dynamic await)
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // Optional Replit plugins — guard them in try/catch to avoid crashes locally
    ...(() => {
      const plugins = [];
      try {
        // @ts-ignore - optional deps
        const { cartographer } = require("@replit/vite-plugin-cartographer");
        plugins.push(cartographer());
      } catch {}
      try {
        // @ts-ignore - optional deps
        const { default: devBanner } = require("@replit/vite-plugin-dev-banner");
        plugins.push(devBanner());
      } catch {}
      return plugins;
    })(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
});