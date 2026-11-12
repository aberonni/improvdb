import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests for plain logic, kept next to the code as *.test.ts. Browser and
// server behaviour is covered by the Playwright suite in tests/.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
