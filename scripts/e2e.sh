#!/bin/sh
# Runs the E2E suite against a fresh database. Used both in CI and locally
# (via `npm run test:e2e`). Extra arguments are passed to `playwright test`.
set -e

[ -f .env ] || cp .env.example .env

npm ci

npx prisma db push
echo "Checking for pending migrations..."
npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema \
  --exit-code \
  --shadow-database-url="$DATABASE_URL"
echo "Seeding database..."
npx prisma db seed

npx playwright test "$@"
