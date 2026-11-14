/**
 * Lighthouse CI config, run by scripts/lighthouse.sh once per preset against
 * the seeded production build. The preset comes from LH_FORM_FACTOR
 * (mobile|desktop), not an LHCI_* variable, which Lighthouse CI would read
 * as one of its own options.
 *
 * Budgets catch big regressions rather than small drifts: layout shift is
 * strict, blocking time is loose since it varies a lot between runs. The
 * seed has far fewer Resources than production, so these numbers are lower
 * than improvdb.com's.
 */
const preset = process.env.LH_FORM_FACTOR === "desktop" ? "desktop" : "mobile";

/**
 * Total Blocking Time budget in ms, per preset. When added, medians were
 * ~400 ms (mobile) and ~25 ms (desktop), with single runs up to ~580 and
 * ~120, so the budgets leave room for slower, noisier CI runners.
 */
const TBT_BUDGET = { mobile: 800, desktop: 300 };

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
        onlyCategories: ["performance"],
        // Root in the container, and no GPU
        chromeFlags: "--no-sandbox --headless=new --disable-gpu",
      },
    },
    assert: {
      // Checked against the median of the runs for each URL
      aggregationMethod: "median-run",
      assertions: {
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": [
          "error",
          { maxNumericValue: TBT_BUDGET[preset] },
        ],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: `.lighthouseci/${preset}`,
    },
  },
};
