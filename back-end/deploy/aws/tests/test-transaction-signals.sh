#!/usr/bin/env bash
set -euo pipefail

AWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

# shellcheck source=../deploy.sh
source "$AWS_DIR/deploy.sh"

printf 'old environment\n' > "$TEST_TMP/previous.env"
printf 'new environment\n' > "$TEST_TMP/backend.env"

set +e
bash -c '
  source "$1"
  DEPLOY_PHASE=env_replaced
  ENV_TARGET="$2/backend.env"
  ENV_SNAPSHOT="$2/previous.env"
  HAD_PREVIOUS_ENV=true
  ROLLBACK_DIR=""
  PREVIOUS_HEAD=""
  REPO_DIR=""
  install_transaction_traps
  kill -TERM $$
' _ "$AWS_DIR/deploy.sh" "$TEST_TMP" >"$TEST_TMP/out" 2>"$TEST_TMP/err"
signal_status=$?
set -e
[[ "$signal_status" == 143 ]] || fail "TERM exited with $signal_status instead of 143"
[[ "$(cat "$TEST_TMP/backend.env")" == 'old environment' ]] || fail 'TERM before candidate activation did not restore environment'

printf 'new environment\n' > "$TEST_TMP/backend.env"
set +e
bash -c '
  source "$1"
  DEPLOY_PHASE=env_replaced
  ENV_TARGET="$2/backend.env"
  ENV_SNAPSHOT="$2/previous.env"
  HAD_PREVIOUS_ENV=true
  ROLLBACK_DIR=""
  PREVIOUS_HEAD=""
  REPO_DIR=""
  install_transaction_traps
  kill -INT $$
' _ "$AWS_DIR/deploy.sh" "$TEST_TMP" >"$TEST_TMP/out" 2>"$TEST_TMP/err"
interrupt_status=$?
set -e
[[ "$interrupt_status" == 130 ]] || fail "INT exited with $interrupt_status instead of 130"
[[ "$(cat "$TEST_TMP/backend.env")" == 'old environment' ]] || fail 'INT before candidate activation did not restore environment'

printf 'new environment\n' > "$TEST_TMP/backend.env"
set +e
bash -c '
  source "$1"
  DEPLOY_PHASE=env_replaced
  ENV_TARGET="$2/backend.env"
  ENV_SNAPSHOT="$2/previous.env"
  HAD_PREVIOUS_ENV=true
  ROLLBACK_DIR=""
  PREVIOUS_HEAD=""
  REPO_DIR=""
  install_transaction_traps
  exit 42
' _ "$AWS_DIR/deploy.sh" "$TEST_TMP" >"$TEST_TMP/out" 2>"$TEST_TMP/err"
exit_status=$?
set -e
[[ "$exit_status" == 42 ]] || fail "EXIT preserved status $exit_status instead of 42"
[[ "$(cat "$TEST_TMP/backend.env")" == 'old environment' ]] || fail 'EXIT before candidate activation did not restore environment'

mkdir -p "$TEST_TMP/candidate-runtime/recovery"
printf 'candidate environment\n' > "$TEST_TMP/candidate-runtime/backend.env"
printf 'previous environment\n' > "$TEST_TMP/candidate-runtime/recovery/backend.env"
printf 'name: previous-runtime\nservices: {}\n' > "$TEST_TMP/candidate-runtime/recovery/compose.yml"
printf 'previous caddy\n' > "$TEST_TMP/candidate-runtime/recovery/Caddyfile"
set +e
bash -c '
  source "$1"
  DOCKER_LOG="$2/docker.log"
  docker() { printf "%s\n" "$*" >> "$DOCKER_LOG"; }
  wait_for_api_ready() { printf "ready\n" >> "$DOCKER_LOG"; }
  DEPLOY_PHASE=candidate_started
  RUNTIME_DIR="$2"
  ENV_TARGET="$2/backend.env"
  ENV_SNAPSHOT="$2/recovery/backend.env"
  HAD_PREVIOUS_ENV=true
  ROLLBACK_DIR="$2/recovery"
  PREVIOUS_IMAGE=toeic-green-api:previous
  PREVIOUS_COMPOSE_FILE="$2/recovery/compose.yml"
  PREVIOUS_HEAD=""
  REPO_DIR=""
  COMPOSE_FILE="$1"
  install_transaction_traps
  kill -TERM $$
' _ "$AWS_DIR/deploy.sh" "$TEST_TMP/candidate-runtime" >"$TEST_TMP/out" 2>"$TEST_TMP/err"
candidate_signal_status=$?
set -e
[[ "$candidate_signal_status" == 143 ]] || fail "candidate-started TERM exited with $candidate_signal_status instead of 143"
[[ "$(cat "$TEST_TMP/candidate-runtime/backend.env")" == 'previous environment' ]] || \
  fail 'candidate-started TERM did not restore the previous environment'
grep -q "compose -f $TEST_TMP/candidate-runtime/recovery/compose.yml" "$TEST_TMP/candidate-runtime/docker.log" || \
  fail 'candidate-started TERM did not use the previous Compose definition'
grep -q '^ready$' "$TEST_TMP/candidate-runtime/docker.log" || fail 'candidate-started TERM did not verify rollback health'
[[ ! -e "$TEST_TMP/candidate-runtime/recovery" ]] || fail 'successful candidate rollback retained a stale recovery snapshot'

ROLLBACK_LOG="$TEST_TMP/rollback.log"
rollback_candidate() { printf 'rollback\n' >> "$ROLLBACK_LOG"; }
export -f rollback_candidate
export ROLLBACK_LOG
DEPLOY_PHASE=candidate_started
handle_transaction_failure
grep -q rollback "$ROLLBACK_LOG" || fail 'candidate-started failure did not invoke rollback'

: > "$ROLLBACK_LOG"
DEPLOY_PHASE=api_healthy
ROLLBACK_DIR="$TEST_TMP/recovery-snapshot"
mkdir "$ROLLBACK_DIR"
printf 'previous environment\n' > "$ROLLBACK_DIR/backend.env"
printf '0123456789012345678901234567890123456789\n' > "$ROLLBACK_DIR/previous-head"
printf 'toeic-green-api:previous\n' > "$ROLLBACK_DIR/previous-image"
printf 'true\n' > "$ROLLBACK_DIR/had-previous-env"
handle_transaction_failure
[[ ! -s "$ROLLBACK_LOG" ]] || fail 'routing-only failure rolled back a healthy API'
[[ -f "$ROLLBACK_DIR/backend.env" ]] || fail 'routing-only failure deleted the sole recovery snapshot'
[[ -f "$ROLLBACK_DIR/previous-head" && -f "$ROLLBACK_DIR/previous-image" && -f "$ROLLBACK_DIR/had-previous-env" ]] || \
  fail 'routing-only failure did not retain durable rollback metadata'
