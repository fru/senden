import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      name: "senden",
      entry: resolve(__dirname, "src/main.ts"),
      formats: ["es", "umd"],
    },
  },
  resolve: {
    alias: {
      senden: resolve("src/"),
    },
  },
});
