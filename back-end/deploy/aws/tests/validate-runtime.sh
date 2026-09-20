#!/usr/bin/env bash
set -euo pipefail

AWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT

# shellcheck source=../render-env.sh
source "$AWS_DIR/render-env.sh"
write_env_file "$TEST_TMP/backend.env" \
  JWT_SECRET secret JWT_REFRESH_SECRET refresh DATABASE_URL database DIRECT_URL direct \
  REDIS_URL redis R2_ACCOUNT_ID account R2_ACCESS_KEY access R2_SECRET_KEY secret \
  RESEND_API_KEY resend GOOGLE_CLIENT_SECRET google

API_HOSTS='staging.example.com, api.example.com' IMAGE_TAG=test RUNTIME_DIR="$TEST_TMP" \
  docker compose -f "$AWS_DIR/compose.yml" run --rm --no-deps caddy \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
