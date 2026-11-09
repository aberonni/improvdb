#!/bin/sh
# Runs scripts/e2e.sh inside the isolated Docker environment (fresh Postgres,
# same Playwright image as CI), then tears it down. Extra arguments are
# passed to `playwright test`.
COMPOSE="docker compose -f docker-compose.e2e.yml"

$COMPOSE run --rm e2e ./scripts/e2e.sh "$@"
status=$?
$COMPOSE down
exit $status
