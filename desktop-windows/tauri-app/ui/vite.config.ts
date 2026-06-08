import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Tauri expects a fixed dev port and no clearing of the screen so Rust logs stay.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
