import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE ?? "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 4173,
    strictPort: true,
    watch: { ignored: ["**/tmp/**"] },
  },
  build: {
    // content 数据块约 570 kB（gzip 129 kB），是知识库正文而非代码；单独放宽阈值。
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "content", test: /src[\\/]generated[\\/]content\.json/, priority: 30 },
            { name: "react", test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
});
