#!/bin/sh
# Prepares a production build against a fresh, seeded database. Shared by
# scripts/e2e.sh and scripts/lighthouse.sh, in CI and locally (via
# scripts/in-docker.sh).
set -e

[ -f .env ] || cp .env.example .env

# Skip the install when node_modules (cached by CI, or a volume in Docker)
# came from this exact lockfile
lock_hash=$(sha256sum package-lock.json | cut -d" " -f1)
if [ "$(cat node_modules/.lock-hash 2>/dev/null)" = "$lock_hash" ]; then
  echo "node_modules matches package-lock.json, skipping npm ci"
  npx prisma generate
else
  npm ci
  echo "$lock_hash" > node_modules/.lock-hash
fi

echo "Checking for pending migrations..."
# Uses the database as its shadow database, which wipes it, so it runs first
npx prisma migrate diff \
  --from-migrations ./prisma/schema/migrations \
  --to-schema-datamodel ./prisma/schema \
  --exit-code \
  --shadow-database-url="$DATABASE_URL"

# Build the database from migrations, as production does, so this also proves
# they apply cleanly. `npm run build` below runs `migrate deploy`, which
# refuses a database it didn't create.
npx prisma migrate reset --force --skip-seed
echo "Seeding database..."
npx prisma db seed

# After seeding: the build pre-renders pages from the database
npm run build
