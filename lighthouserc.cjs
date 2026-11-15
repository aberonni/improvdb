/**
 * Lighthouse CI config, run by scripts/lighthouse.sh once per preset against
 * the seeded production build. The preset comes from LH_FORM_FACTOR
 * (mobile|desktop), not an LHCI_* variable, which Lighthouse CI would read
 * as one of its own options.
 *
 * Sizes, DOM size and the accessibility, best practices and SEO scores only
 * change with the code, so their budgets are strict (about 10% over what
 * the pages weighed when they were added). Timings vary a lot between runs,
 * so theirs only catch big regressions. The seed has far fewer Resources
 * than production, so these numbers are lower than improvdb.com's.
 */
const preset = process.env.LH_FORM_FACTOR === "desktop" ? "desktop" : "mobile";

const KB = 1024;

/** Timing budgets in ms, per preset */
const TIMING = {
  // Medians were ~400–970 ms (mobile) and ~25 ms (desktop) when added
  "total-blocking-time": { mobile: 1500, desktop: 500 },
  // Medians were ~3.0–3.4 s (mobile, simulated slow 4G) and ~0.6 s (desktop)
  "largest-contentful-paint": { mobile: 4500, desktop: 1500 },
};

/** @param {number} maxNumericValue */
const max = (maxNumericValue) => ["error", { maxNumericValue }];

/** Checked on every page */
const PAGE_ASSERTIONS = {
  "cumulative-layout-shift": max(0.1),
  "total-blocking-time": max(TIMING["total-blocking-time"][preset]),
  "largest-contentful-paint": max(TIMING["largest-contentful-paint"][preset]),

  // Transfer sizes, in bytes. JS was ~275–320 KB: on the home page, the
  // Resource page's chunks (~42 KB) that Next.js prefetches for the visible
  // rows land within some runs and not others. Page weight up to ~600 KB.
  "resource-summary:script:size": max(350 * KB),
  "resource-summary:stylesheet:size": max(16 * KB),
  "resource-summary:font:size": max(55 * KB),
  "total-byte-weight": max(660 * KB),
  "resource-summary:third-party:count": max(0),

  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:best-practices": ["error", { minScore: 1 }],
  "categories:seo": ["error", { minScore: 1 }],
};

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      url: [
        "http://127.0.0.1:3000/",
        // The published Resource with the longest description. (The kitchen
        // sink fixture is unpublished, so visitors only see an empty page.)
        "http://127.0.0.1:3000/resource/switch-left",
      ],
      numberOfRuns: 3,
      settings: {
        ...(preset === "desktop" ? { preset: "desktop" } : {}),
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        // Root in the container, and no GPU
        chromeFlags: "--no-sandbox --headless=new --disable-gpu",
      },
    },
    assert: {
      // Each entry is checked against the median run of each matching URL
      assertMatrix: [
        {
          matchingUrlPattern: ".*",
          aggregationMethod: "median-run",
          assertions: PAGE_ASSERTIONS,
        },
        {
          // The Catalogue: one row per seeded Resource (~1,325 elements), so
          // refreshing seedData.json with more Resources may need a bump
          matchingUrlPattern: "127\\.0\\.0\\.1:3000/$",
          aggregationMethod: "median-run",
          assertions: { "dom-size": max(1500) },
        },
        {
          // ~190 elements
          matchingUrlPattern: "/resource/",
          aggregationMethod: "median-run",
          assertions: { "dom-size": max(250) },
        },
      ],
    },
    upload: {
      target: "filesystem",
      outputDir: `.lighthouseci/${preset}`,
    },
  },
};
