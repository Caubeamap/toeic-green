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

grep -q 'docker compose.*run.*--rm.*migrator' "$AWS_DIR/deploy.sh" || fail 'migration does not use docker compose run --rm migrator'
if grep -q 'docker run.*--env-file' "$AWS_DIR/deploy.sh"; then
  fail 'migration still uses docker run --env-file'
fi

git init -q --bare "$TEST_TMP/origin.git"
git init -q -b main "$TEST_TMP/source"
git -C "$TEST_TMP/source" -c user.name=Test -c user.email=test@example.com commit --allow-empty -qm first
reachable_sha="$(git -C "$TEST_TMP/source" rev-parse HEAD)"
git -C "$TEST_TMP/source" remote add origin "$TEST_TMP/origin.git"
git -C "$TEST_TMP/source" push -q -u origin main
git --git-dir="$TEST_TMP/origin.git" symbolic-ref HEAD refs/heads/main
git clone -q "$TEST_TMP/origin.git" "$TEST_TMP/release"

verify_release "$TEST_TMP/release" main "$reachable_sha" >/dev/null 2>&1 || fail 'reachable clean release was rejected'
if verify_release "$TEST_TMP/release" main main >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'mutable branch name was accepted as DEPLOY_SHA'
fi
if verify_release "$TEST_TMP/release" main "${reachable_sha:0:12}" >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'abbreviated commit SHA was accepted as DEPLOY_SHA'
fi
git -C "$TEST_TMP/release" tag release-tag "$reachable_sha"
if verify_release "$TEST_TMP/release" main release-tag >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'mutable tag name was accepted as DEPLOY_SHA'
fi

real_git="$(command -v git)"
assert_git_failure_rejected() {
  local operation="$1" status="$2" output
  if output="$(
    git() {
      [[ "${3:-}" == "$operation" ]] && return "$status"
      command "$real_git" "$@"
    }
    verify_release "$TEST_TMP/release" main "$reachable_sha"
  )" 2>"$TEST_TMP/err"; then
    fail "failed git $operation was reported as success"
  fi
  [[ -z "$output" ]] || fail "failed git $operation printed a release SHA"
}

assert_git_failure_rejected fetch 70
assert_git_failure_rejected rev-parse 71
assert_git_failure_rejected merge-base 72
assert_git_failure_rejected checkout 73

printf dirty > "$TEST_TMP/release/dirty.txt"
if verify_release "$TEST_TMP/release" main "$reachable_sha" >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'dirty release tree was accepted'
fi
rm "$TEST_TMP/release/dirty.txt"

git -C "$TEST_TMP/release" -c user.name=Test -c user.email=test@example.com checkout -qb unreachable
git -C "$TEST_TMP/release" -c user.name=Test -c user.email=test@example.com commit --allow-empty -qm unreachable
unreachable_sha="$(git -C "$TEST_TMP/release" rev-parse HEAD)"
if verify_release "$TEST_TMP/release" main "$unreachable_sha" >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'commit unreachable from origin/main was accepted'
fi

mkdir -p "$TEST_TMP/runtime"
printf 'lock sentinel\n' > "$TEST_TMP/runtime/backend.env"
acquire_deploy_lock "$TEST_TMP/runtime"
if bash -c 'source "$1"; acquire_deploy_lock "$2"' _ "$AWS_DIR/deploy.sh" "$TEST_TMP/runtime" \
  >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'concurrent deployment acquired the host-wide lock'
fi
grep -qi 'already in progress' "$TEST_TMP/err" || fail 'lock contention error was unclear'
[[ "$(cat "$TEST_TMP/runtime/backend.env")" == 'lock sentinel' ]] || fail 'lock contention changed runtime state'
eval "exec ${DEPLOY_LOCK_FD}>&-"

mkdir -p "$TEST_TMP/snapshot-repo/back-end/deploy/aws" "$TEST_TMP/snapshot-runtime"
git init -q "$TEST_TMP/snapshot-repo"
git -C "$TEST_TMP/snapshot-repo" -c user.name=Test -c user.email=test@example.com \
  commit --allow-empty -qm previous
snapshot_head="$(git -C "$TEST_TMP/snapshot-repo" rev-parse HEAD)"
printf 'name: previous-runtime\nservices: {}\n' > "$TEST_TMP/snapshot-repo/back-end/deploy/aws/compose.yml"
printf 'previous.example.com { respond "previous" }\n' > "$TEST_TMP/snapshot-repo/back-end/deploy/aws/Caddyfile"
printf 'snapshot environment\n' > "$TEST_TMP/snapshot-runtime/backend.env"
ROLLBACK_DIR=""
prepare_transaction_snapshot "$TEST_TMP/snapshot-repo" "$TEST_TMP/snapshot-runtime"
[[ "$PREVIOUS_HEAD" == "$snapshot_head" ]] || fail 'transaction snapshot did not record previous HEAD'
[[ "$(cat "$ROLLBACK_DIR/previous-head")" == "$snapshot_head" ]] || fail 'recovery snapshot did not persist previous HEAD'
[[ "$(cat "$ROLLBACK_DIR/had-previous-env")" == true ]] || fail 'recovery snapshot did not persist environment existence'
grep -q previous-runtime "$PREVIOUS_COMPOSE_FILE" || fail 'transaction snapshot did not preserve previous Compose definition'
grep -q previous.example.com "$ROLLBACK_DIR/Caddyfile" || fail 'transaction snapshot did not preserve previous Caddyfile'
[[ "$(stat -c '%a' "$PREVIOUS_COMPOSE_FILE")" == 600 ]] || fail 'Compose recovery snapshot is not mode 0600'
[[ "$(stat -c '%a' "$ROLLBACK_DIR/Caddyfile")" == 600 ]] || fail 'Caddy recovery snapshot is not mode 0600'
cleanup_transaction_snapshot

mkdir "$TEST_TMP/image-metadata"
docker() {
  if [[ "$1 $2" == 'container ls' ]]; then
    printf 'toeic-green-api\n'
  elif [[ "$1" == inspect ]]; then
    return 55
  fi
}
if capture_previous_image "$TEST_TMP/image-metadata" >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'unexpected Docker inspect failure was treated as no previous release'
fi
docker() {
  if [[ "$1 $2" == 'container ls' ]]; then
    printf 'toeic-green-api\n'
  elif [[ "$1" == inspect ]]; then
    printf 'toeic-green-api:previous\n'
  fi
}
capture_previous_image "$TEST_TMP/image-metadata"
[[ "$PREVIOUS_IMAGE" == 'toeic-green-api:previous' ]] || fail 'previous API image was not captured'
[[ "$(cat "$TEST_TMP/image-metadata/previous-image")" == 'toeic-green-api:previous' ]] || \
  fail 'recovery snapshot did not persist previous API image'
[[ "$(stat -c '%a' "$TEST_TMP/image-metadata/previous-image")" == 600 ]] || \
  fail 'previous image metadata is not mode 0600'

printf '#!/usr/bin/env bash\nprintf "candidate environment\\n" > "$RUNTIME_DIR/backend.env"\nexit 42\n' \
  > "$TEST_TMP/failing-render-env.sh"
chmod +x "$TEST_TMP/failing-render-env.sh"
printf 'previous environment\n' > "$TEST_TMP/runtime/backend.env.previous"
printf 'current environment\n' > "$TEST_TMP/runtime/backend.env"
DEPLOY_PHASE=release_checkout
if replace_backend_environment "$TEST_TMP/failing-render-env.sh" test-region "$TEST_TMP/runtime"; then
  fail 'failed environment render was reported as success'
fi
[[ "$DEPLOY_PHASE" == env_replaced ]] || fail 'environment recovery phase advanced after, not before, rendering'
restore_previous_env "$TEST_TMP/runtime/backend.env" "$TEST_TMP/runtime/backend.env.previous" true
[[ "$(cat "$TEST_TMP/runtime/backend.env")" == 'previous environment' ]] || \
  fail 'failed environment render could not restore previous environment'

printf 'old environment\n' > "$TEST_TMP/runtime/backend.env.previous"
printf 'new environment\n' > "$TEST_TMP/runtime/backend.env"
printf 'name: previous-runtime\nservices: {}\n' > "$TEST_TMP/runtime/previous-compose.yml"
DOCKER_LOG="$TEST_TMP/docker.log"
docker() { printf '%s\n' "$*" >> "$DOCKER_LOG"; }
export DOCKER_LOG

(
  wait_for_api_ready() { return 0; }
  COMPOSE_FILE="$AWS_DIR/compose.yml" RUNTIME_DIR="$TEST_TMP/runtime" HAD_PREVIOUS_ENV=true \
    rollback_candidate 'toeic-green-api:previous' "$TEST_TMP/runtime/backend.env.previous" \
      "$TEST_TMP/runtime/previous-compose.yml" '' ''
)
[[ "$(cat "$TEST_TMP/runtime/backend.env")" == 'old environment' ]] || fail 'rollback did not restore previous environment'
grep -q 'compose .*up -d --no-deps --no-build --force-recreate api' "$DOCKER_LOG" || fail 'rollback did not restore the previous API image'
grep -q "compose -f $TEST_TMP/runtime/previous-compose.yml" "$DOCKER_LOG" || fail 'rollback used candidate Compose definition'

git init -q "$TEST_TMP/checkout-repo"
git -C "$TEST_TMP/checkout-repo" -c user.name=Test -c user.email=test@example.com commit --allow-empty -qm previous
previous_head="$(git -C "$TEST_TMP/checkout-repo" rev-parse HEAD)"
git -C "$TEST_TMP/checkout-repo" -c user.name=Test -c user.email=test@example.com commit --allow-empty -qm candidate
candidate_head="$(git -C "$TEST_TMP/checkout-repo" rev-parse HEAD)"
docker() { return 1; }
if COMPOSE_FILE="$AWS_DIR/compose.yml" RUNTIME_DIR="$TEST_TMP/runtime" HAD_PREVIOUS_ENV=true \
  rollback_candidate 'toeic-green-api:previous' "$TEST_TMP/runtime/backend.env.previous" \
    "$TEST_TMP/runtime/previous-compose.yml" "$previous_head" "$TEST_TMP/checkout-repo" \
    >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'failed previous API restart was reported as successful rollback'
fi
[[ "$(git -C "$TEST_TMP/checkout-repo" rev-parse HEAD)" == "$previous_head" ]] || \
  fail 'rollback failure did not restore the previous repository checkout when possible'
git -C "$TEST_TMP/checkout-repo" checkout -q --detach "$candidate_head"

rollback_candidate() { printf 'rollback %s\n' "$1" >> "$DOCKER_LOG"; }
docker() { return 1; }
: > "$DOCKER_LOG"
if COMPOSE_FILE="$AWS_DIR/compose.yml" activate_candidate 2>"$TEST_TMP/err"; then
  fail 'candidate connection failure was reported as success'
fi

docker() {
  if [[ "$1" == inspect ]]; then
    printf unhealthy
  fi
}
if READINESS_ATTEMPTS=1 READINESS_INTERVAL_SECONDS=0 wait_for_api_ready; then
  fail 'candidate readiness failure was reported as success'
fi
curl() { return 22; }
if verify_public_hosts 2>"$TEST_TMP/err"; then
  fail 'public verification failure was reported as success'
fi

parse_api_hosts 'staging.example.com, api.example.com' || fail 'valid API_HOSTS was rejected'
[[ "$API_HOSTS_NORMALIZED" == 'staging.example.com, api.example.com' ]] || fail 'API_HOSTS normalization failed'
if parse_api_hosts 'staging.example.com, ,api.example.com' >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'empty API_HOSTS entry was accepted'
fi
if parse_api_hosts 'staging.example.com,,api.example.com' >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'adjacent comma API_HOSTS entry was accepted'
fi
if parse_api_hosts $'staging.example.com\napi.example.com' >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'newline-delimited API_HOSTS value was accepted'
fi
if parse_api_hosts 'https://outside.example.com' >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'URL was accepted where a hostname is required'
fi
CURL_LOG="$TEST_TMP/curl.log"
curl() { printf '%s\n' "${*: -1}" >> "$CURL_LOG"; }
export CURL_LOG
parse_api_hosts 'staging.example.com,api.example.com'
verify_public_hosts
[[ "$(wc -l < "$CURL_LOG")" == 4 ]] || fail 'public verification did not check live and ready for every API_HOSTS entry'
grep -q 'staging.example.com/api/health/live' "$CURL_LOG" || fail 'staging host was not verified'
grep -q 'api.example.com/api/health/ready' "$CURL_LOG" || fail 'production host was not verified'

curl() { [[ "${*: -1}" == https://unrelated.example.com/* ]]; }
parse_api_hosts 'staging.example.com,api.example.com'
if verify_public_hosts >"$TEST_TMP/out" 2>"$TEST_TMP/err"; then
  fail 'an unrelated substitute hostname satisfied public verification'
fi

: > "$DOCKER_LOG"
docker() { printf '%s\n' "$*" >> "$DOCKER_LOG"; }
COMPOSE_FILE="$AWS_DIR/compose.yml" reload_caddy
grep -q 'compose .*run --rm --no-deps caddy caddy validate' "$DOCKER_LOG" || fail 'Caddy configuration was not validated'
grep -q 'compose .*up -d --no-deps --force-recreate caddy' "$DOCKER_LOG" || fail 'Caddy is not force-recreated after configuration change'

: > "$DOCKER_LOG"
docker() {
  if [[ "$1 $2" == 'images toeic-green-api' ]]; then
    printf '%s\n' toeic-green-api:current toeic-green-api:rollback toeic-green-api:old
  elif [[ "$1 $2" == 'images toeic-green-migrator' ]]; then
    printf '%s\n' toeic-green-migrator:current toeic-green-migrator:old
  else
    printf '%s\n' "$*" >> "$DOCKER_LOG"
  fi
}
IMAGE_TAG=current cleanup_images toeic-green-api:current toeic-green-api:rollback
grep -q 'image rm toeic-green-api:old' "$DOCKER_LOG" || fail 'safe old API image was not removed'
grep -q 'image rm toeic-green-migrator:old' "$DOCKER_LOG" || fail 'safe old migrator image was not removed'
if grep -Eq 'image rm toeic-green-api:(current|rollback)|image rm toeic-green-migrator:current' "$DOCKER_LOG"; then
  fail 'cleanup attempted to remove current or rollback images'
fi
grep -q "builder prune --force --filter until=168h" "$DOCKER_LOG" || fail 'BuildKit cleanup is not age-bounded'
if grep -q -- '--keep-storage' "$DOCKER_LOG"; then
  fail 'unsupported builder prune --keep-storage flag is still used'
fi

: > "$DOCKER_LOG"
docker() {
  if [[ "$1" == images ]]; then
    return 0
  fi
  printf '%s\n' "$*" >> "$DOCKER_LOG"
  [[ "$1 $2" != 'builder prune' ]]
}
if ! warning="$(IMAGE_TAG=current cleanup_images toeic-green-api:current toeic-green-api:rollback 2>&1)"; then
  fail 'BuildKit prune failure failed the deployment cleanup'
fi
[[ "$warning" == *WARNING* ]] || fail 'BuildKit prune failure emitted no warning'
