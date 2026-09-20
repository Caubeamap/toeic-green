#!/usr/bin/env bash
set -euo pipefail

AWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

grep -q '^  migrator:' "$AWS_DIR/compose.yml" || fail 'migrator service is missing'
grep -q '/api/health/ready' "$AWS_DIR/compose.yml" || fail 'API healthcheck does not use readiness'
grep -q 'health_uri /api/health/ready' "$AWS_DIR/Caddyfile" || fail 'Caddy active health does not use readiness'
grep -q '{\$API_HOSTS}' "$AWS_DIR/Caddyfile" || fail 'Caddyfile does not support API_HOSTS'

if grep -A20 '^  api:' "$AWS_DIR/compose.yml" | grep -q 'ports:'; then
  fail 'API publishes a host port'
fi

API_HOSTS='staging.example.com, api.example.com' IMAGE_TAG=test \
  docker compose -f "$AWS_DIR/compose.yml" config --no-env-resolution >/dev/null
