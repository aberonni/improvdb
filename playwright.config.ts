import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry once on CI, so a flake is reported as flaky rather than failing */
  retries: process.env.CI ? 1 : 0,
  /* GitHub's standard runner has 4 vCPUs. Tests must not share mutable data. */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { host: "0.0.0.0" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://127.0.0.1:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    // Capture screenshot after each test failure.
    screenshot: "only-on-failure",
  },

  /*
   * Specs that render pages run on desktop Chromium and mobile WebKit.
   * Specs in tests/http/ only check what the server sends (headers, meta tags,
   * generated images), which doesn't depend on the browser, so they run once.
   */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      testIgnore: "http/**",
    },
  ],

  /*
   * On CI (and in `npm run test:e2e`, which sets CI) scripts/e2e.sh has already
   * run a production build, so serve it. Locally, use or start the dev server.
   */
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
