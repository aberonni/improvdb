import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Integration tests, kept next to the code as *.integration.test.ts. They use
// the database in DATABASE_URL, so they run in scripts/e2e.sh against the
// fresh, seeded one (`npm run test:e2e` locally).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.integration.test.ts"],
    // One file at a time: they share the database
    fileParallelism: false,
  },
});
