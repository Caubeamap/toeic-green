#!/usr/bin/env bash
set -euo pipefail

AWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

# shellcheck source=../render-env.sh
source "$AWS_DIR/render-env.sh"

target="$TEST_TMP/backend.env"
write_env_file "$target" \
  JWT_SECRET "space # dollar \$ back\\slash and apostrophe '" \
  JWT_REFRESH_SECRET 'refresh secret' \
  DATABASE_URL 'postgresql://user:p$a\ss@db/app?x=a#fragment' \
  DIRECT_URL 'postgresql://direct/db' \
  REDIS_URL 'rediss://default:pa ss@redis:6379' \
  R2_ACCOUNT_ID account R2_ACCESS_KEY access R2_SECRET_KEY "it's\\literal" \
  RESEND_API_KEY 're_$end' GOOGLE_CLIENT_SECRET 'google secret'

parse_env_value() {
  local key="$1" line value
  line="$(grep -F "$key=" "$target")"
  value="${line#*=}"
  value="${value:1:${#value}-2}"
  value="${value//\\\'/\'}"
  printf '%s' "$value"
}

expected="space # dollar \$ back\\slash and apostrophe '"
[[ "$(parse_env_value JWT_SECRET)" == "$expected" ]] || fail 'Compose env serialization changed special characters'
[[ "$(parse_env_value DATABASE_URL)" == 'postgresql://user:p$a\ss@db/app?x=a#fragment' ]] || fail 'DATABASE_URL was not preserved'
[[ "$(parse_env_value R2_SECRET_KEY)" == "it's\\literal" ]] || fail 'apostrophe/backslash value was not preserved'
[[ "$(stat -c '%a' "$target")" == 600 ]] || fail 'backend.env mode is not 0600'

printf 'sentinel\n' > "$target"
chmod 600 "$target"
if write_env_file "$target" \
  JWT_SECRET $'invalid\nsecret' JWT_REFRESH_SECRET refresh DATABASE_URL database DIRECT_URL direct \
  REDIS_URL redis R2_ACCOUNT_ID account R2_ACCESS_KEY access R2_SECRET_KEY secret \
  RESEND_API_KEY resend GOOGLE_CLIENT_SECRET google >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'render accepted a newline in JWT_SECRET'
fi
grep -q 'JWT_SECRET' "$TEST_TMP/err" || fail 'invalid value error did not identify JWT_SECRET'
[[ "$(cat "$target")" == sentinel ]] || fail 'failed render replaced the prior environment'
if find "$TEST_TMP" -maxdepth 1 -type f ! -name backend.env ! -name out ! -name err | grep -q .; then
  fail 'render left a decrypted temporary file'
fi

if write_env_file "$target" \
  JWT_SECRET $'invalid\rsecret' JWT_REFRESH_SECRET refresh DATABASE_URL database DIRECT_URL direct \
  REDIS_URL redis R2_ACCOUNT_ID account R2_ACCESS_KEY access R2_SECRET_KEY secret \
  RESEND_API_KEY resend GOOGLE_CLIENT_SECRET google >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'render accepted a carriage return in JWT_SECRET'
fi
grep -q 'JWT_SECRET' "$TEST_TMP/err" || fail 'carriage-return error did not identify JWT_SECRET'

printf 'previous environment\n' > "$target"
chmod 640 "$target"
if (
  mv() { return 1; }
  write_env_file "$target" \
    JWT_SECRET replacement JWT_REFRESH_SECRET refresh DATABASE_URL database DIRECT_URL direct \
    REDIS_URL redis R2_ACCOUNT_ID account R2_ACCESS_KEY access R2_SECRET_KEY secret \
    RESEND_API_KEY resend GOOGLE_CLIENT_SECRET google
); then
  fail 'failed atomic rename was reported as success'
fi
[[ "$(cat "$target")" == 'previous environment' ]] || fail 'failed atomic rename changed backend.env content'
[[ "$(stat -c '%a' "$target")" == 640 ]] || fail 'failed atomic rename changed backend.env mode'
if find "$TEST_TMP" -maxdepth 1 -type f -name 'backend.env.tmp.*' | grep -q .; then
  fail 'failed atomic rename left a decrypted temporary file'
fi

nul_encoded="$(printf 'invalid\0secret' | base64 | tr -d '\n')"
if validate_encoded_value JWT_SECRET "$nul_encoded" >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'render accepted a NUL in JWT_SECRET'
fi
grep -q 'JWT_SECRET' "$TEST_TMP/err" || fail 'NUL error did not identify JWT_SECRET'

if [[ "${RUN_DOCKER_RUNTIME_TESTS:-false}" == true ]]; then
  cat > "$TEST_TMP/compose.yml" <<YAML
services:
  parser:
    image: ${COMPOSE_TEST_IMAGE:-application-backend:latest}
    env_file:
      - $target
YAML
  write_env_file "$target" \
    JWT_SECRET "$expected" JWT_REFRESH_SECRET refresh \
    DATABASE_URL 'postgresql://user:p$a\ss@db/app?x=a#fragment' DIRECT_URL direct REDIS_URL redis \
    R2_ACCOUNT_ID account R2_ACCESS_KEY access R2_SECRET_KEY "it's\\literal" \
    RESEND_API_KEY resend GOOGLE_CLIENT_SECRET google
  actual="$(docker compose -f "$TEST_TMP/compose.yml" run --rm --no-deps parser \
    node -e 'process.stdout.write(process.env.JWT_SECRET)')"
  [[ "$actual" == "$expected" ]] || fail 'Docker Compose env_file parser changed special characters'
fi
