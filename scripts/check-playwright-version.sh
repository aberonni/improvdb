#!/usr/bin/env bash
# Fails when @playwright/test and the Playwright Docker image (CI and
# docker-compose.test.yml) are on different versions. Renovate groups them, but
# the npm release and the image land days apart, so one can arrive alone; this
# keeps that PR red (and out of auto-merge) until Renovate adds the other.
set -euo pipefail
cd "$(dirname "$0")/.."

npm_version=$(node -p 'require("./package.json").devDependencies["@playwright/test"]')
status=0
for file in .github/workflows/app-job.yml docker-compose.test.yml; do
  image_version=$(sed -nE 's#.*mcr\.microsoft\.com/playwright:v([0-9][^-]*)-.*#\1#p' "$file")
  if [ "$image_version" != "$npm_version" ]; then
    echo "$file uses Playwright image v${image_version:-?}, but package.json has @playwright/test $npm_version" >&2
    status=1
  fi
done
exit $status
