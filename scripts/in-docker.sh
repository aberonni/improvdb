#!/bin/sh
# Runs a script inside the isolated Docker environment (fresh Postgres, same
# Playwright image as CI), then tears it down. Usage:
#   ./scripts/in-docker.sh ./scripts/e2e.sh [playwright args]
#   ./scripts/in-docker.sh ./scripts/lighthouse.sh
COMPOSE="docker compose -f docker-compose.test.yml"

$COMPOSE run --rm test "$@"
status=$?
$COMPOSE down
exit $status
