import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/* Unit tests for pure logic (lib/ functions). Mirrors the `@/` alias from
   tsconfig.json so tests import modules the way the app does. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
