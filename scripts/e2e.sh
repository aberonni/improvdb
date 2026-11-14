#!/bin/sh
# Runs the E2E suite against a fresh database and a production build. Used
# both in CI and locally (via `npm run test:e2e`). Extra arguments are passed
# to `playwright test`.
set -e

./scripts/prepare-app.sh

# Against the same database; they delete what they create, so the pages
# Playwright checks are unchanged
npm run test:integration

# Playwright serves the build with `npm run start` (see playwright.config.ts)
npx playwright test "$@"
