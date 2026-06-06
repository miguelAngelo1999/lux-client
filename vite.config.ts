import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "lux-js-sdk": path.resolve(__dirname, "modules", "lux-js-sdk"),
    },
  },
  server: {
    proxy: {
      "/proxies": "http://127.0.0.1:8000",
      "/auth": "http://127.0.0.1:8000",
      "/selected": "http://127.0.0.1:8000",
      "/manager": "http://127.0.0.1:8000",
      "/setting": "http://127.0.0.1:8000",
      "/rules": "http://127.0.0.1:8000",
      "/is-admin": "http://127.0.0.1:8000",
      "/ping": "http://127.0.0.1:8000",
      "/version": "http://127.0.0.1:8000",
      "/heartbeat": "http://127.0.0.1:8000",
      "/subscription": "http://127.0.0.1:8000",
      "/connection": "http://127.0.0.1:8000",
      "/runtime-detail": "http://127.0.0.1:8000",
      "/traffic": { target: "ws://127.0.0.1:8000", ws: true },
      "/log": { target: "ws://127.0.0.1:8000", ws: true },
      "/event": { target: "ws://127.0.0.1:8000", ws: true },
      "/dns": "http://127.0.0.1:8000",
    },
  },
});
