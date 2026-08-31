import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: path.resolve(__dirname, "../../"),
  server: {
    host: "::",
    port: 8080,
    // overlay activé : erreurs de module (ex. asset manquant) visibles au lieu d’un écran blanc silencieux
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
      "/admission-files": { target: "http://127.0.0.1:8787", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
