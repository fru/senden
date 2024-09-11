import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      name: "senden",
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["zod"],
      output: {
        globals: {
          zod: "zod",
        },
      },
    },
  },
  resolve: {
    alias: {
      senden: resolve("src/"),
    },
  },
});
