import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Build output — Express serves from dist/ in production
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false
  },

  // Dev-only proxy so the browser doesn't need CORS exceptions locally
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      },
      "/socket.io": {
        target: "http://127.0.0.1:5000",
        ws: true,
        changeOrigin: true
      }
    }
  }
}));
