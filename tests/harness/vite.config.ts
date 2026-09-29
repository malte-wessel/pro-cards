import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  define: { __VERSION__: JSON.stringify("test") },
  server: { fs: { allow: [root] } },
  optimizeDeps: { include: ["@mdi/js"] },
});
