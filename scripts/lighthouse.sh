#!/bin/sh
# Checks performance budgets with Lighthouse CI against a fresh database and a
# production build, on mobile and desktop. Used both in CI and locally (via
# `npm run test:lighthouse`). Budgets and pages are in lighthouserc.cjs;
# reports are written to .lighthouseci/.
set -e

./scripts/prepare-app.sh

# Use the Chromium that ships with the Playwright image
CHROME_PATH=$(node -e "console.log(require('playwright-core').chromium.executablePath())")
export CHROME_PATH

rm -rf .lighthouseci
status=0
for preset in mobile desktop; do
  echo "Running Lighthouse ($preset)..."
  LH_FORM_FACTOR=$preset npx lhci autorun --config=lighthouserc.cjs || status=1
done
exit $status
