#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PHASE="${DEPLOY_PHASE:-initial}"
DEPLOY_LOCK_FD="${DEPLOY_LOCK_FD:-}"
ROLLBACK_DIR="${ROLLBACK_DIR:-}"
ENV_TARGET="${ENV_TARGET:-}"
ENV_SNAPSHOT="${ENV_SNAPSHOT:-}"
HAD_PREVIOUS_ENV="${HAD_PREVIOUS_ENV:-false}"
PREVIOUS_IMAGE="${PREVIOUS_IMAGE:-}"
PREVIOUS_COMPOSE_FILE="${PREVIOUS_COMPOSE_FILE:-}"
PREVIOUS_HEAD="${PREVIOUS_HEAD:-}"
REPO_DIR="${REPO_DIR:-}"
API_HOST_ARRAY=()
API_HOSTS_NORMALIZED=""

log() {
  printf '%s\n' "$*"
}

warn() {
  printf 'WARNING: %s\n' "$*" >&2
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  return 1
}

acquire_deploy_lock() {
  local runtime_dir="$1"
  mkdir -p "$runtime_dir"
  chmod 700 "$runtime_dir"
  exec {DEPLOY_LOCK_FD}>"$runtime_dir/deploy.lock"
  if ! flock -n "$DEPLOY_LOCK_FD"; then
    eval "exec ${DEPLOY_LOCK_FD}>&-"
    DEPLOY_LOCK_FD=""
    die "Another deployment is already in progress"
    return 1
  fi
}

verify_release() {
  local repo_dir="$1" branch="$2" requested_sha="$3" resolved_sha git_status

  if ! git_status="$(git -C "$repo_dir" status --porcelain)"; then
    die "Could not inspect repository status"
    return 1
  fi
  [[ -z "$git_status" ]] || {
    die "Repository has uncommitted or untracked changes; refusing to deploy"
    return 1
  }
  [[ "$requested_sha" =~ ^[0-9a-fA-F]{40}$ ]] || {
    die "DEPLOY_SHA must be an exact 40-character SHA-1 commit ID"
    return 1
  }
  if ! git -C "$repo_dir" fetch --prune origin "$branch"; then
    die "Could not fetch origin/$branch"
    return 1
  fi
  if ! resolved_sha="$(git -C "$repo_dir" rev-parse --verify "${requested_sha}^{commit}")"; then
    die "DEPLOY_SHA does not resolve to a commit: $requested_sha"
    return 1
  fi
  [[ "${resolved_sha,,}" == "${requested_sha,,}" ]] || {
    die "DEPLOY_SHA did not resolve to the exact requested commit: $requested_sha"
    return 1
  }
  if ! git -C "$repo_dir" merge-base --is-ancestor "$resolved_sha" "origin/$branch"; then
    die "Commit $resolved_sha is not reachable from origin/$branch"
    return 1
  fi
  if ! git -C "$repo_dir" checkout --detach "$resolved_sha"; then
    die "Could not check out release commit $resolved_sha"
    return 1
  fi
  printf '%s\n' "$resolved_sha"
}

parse_api_hosts() {
  local raw="$1" part host normalized=""
  local -a parts=()
  API_HOST_ARRAY=()
  API_HOSTS_NORMALIZED=""
  [[ "$raw" != *$'\n'* && "$raw" != *$'\r'* ]] || {
    die "API_HOSTS must not contain line breaks"
    return 1
  }
  IFS=',' read -r -a parts <<< "$raw"
  [[ -n "$raw" && "$raw" != ,* && "$raw" != *, ]] || {
    die "API_HOSTS must be a non-empty comma-separated hostname list"
    return 1
  }
  for part in "${parts[@]}"; do
    host="${part#"${part%%[![:space:]]*}"}"
    host="${host%"${host##*[![:space:]]}"}"
    [[ -n "$host" ]] || {
      die "API_HOSTS contains an empty hostname"
      return 1
    }
    [[ "$host" =~ ^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$ ]] || {
      die "Invalid API_HOSTS hostname: $host"
      return 1
    }
    API_HOST_ARRAY+=("$host")
    [[ -z "$normalized" ]] || normalized+=", "
    normalized+="$host"
  done
  API_HOSTS_NORMALIZED="$normalized"
}

prepare_transaction_snapshot() {
  local repo_dir="$1" runtime_dir="$2"
  ROLLBACK_DIR="$(mktemp -d "$runtime_dir/rollback.XXXXXX")"
  chmod 700 "$ROLLBACK_DIR"
  ENV_TARGET="$runtime_dir/backend.env"
  ENV_SNAPSHOT="$ROLLBACK_DIR/backend.env"
  : > "$ENV_SNAPSHOT"
  chmod 600 "$ENV_SNAPSHOT"
  if [[ -f "$ENV_TARGET" ]]; then
    cp "$ENV_TARGET" "$ENV_SNAPSHOT"
    HAD_PREVIOUS_ENV=true
  else
    HAD_PREVIOUS_ENV=false
  fi
  if ! PREVIOUS_HEAD="$(git -C "$repo_dir" rev-parse --verify HEAD)"; then
    die "Could not record previous repository HEAD"
    return 1
  fi
  printf '%s\n' "$PREVIOUS_HEAD" > "$ROLLBACK_DIR/previous-head"
  printf '%s\n' "$HAD_PREVIOUS_ENV" > "$ROLLBACK_DIR/had-previous-env"
  chmod 600 "$ROLLBACK_DIR/previous-head" "$ROLLBACK_DIR/had-previous-env"
  if [[ -f "$repo_dir/back-end/deploy/aws/compose.yml" ]]; then
    PREVIOUS_COMPOSE_FILE="$ROLLBACK_DIR/compose.yml"
    cp "$repo_dir/back-end/deploy/aws/compose.yml" "$PREVIOUS_COMPOSE_FILE"
    chmod 600 "$PREVIOUS_COMPOSE_FILE"
  fi
  if [[ -f "$repo_dir/back-end/deploy/aws/Caddyfile" ]]; then
    cp "$repo_dir/back-end/deploy/aws/Caddyfile" "$ROLLBACK_DIR/Caddyfile"
    chmod 600 "$ROLLBACK_DIR/Caddyfile"
  fi
}

cleanup_transaction_snapshot() {
  [[ -n "$ROLLBACK_DIR" ]] || return 0
  rm -f "$ROLLBACK_DIR/backend.env" "$ROLLBACK_DIR/compose.yml" "$ROLLBACK_DIR/Caddyfile" \
    "$ROLLBACK_DIR/previous-head" "$ROLLBACK_DIR/previous-image" "$ROLLBACK_DIR/had-previous-env"
  rmdir "$ROLLBACK_DIR" 2>/dev/null || {
    warn "Could not remove transaction snapshot directory $ROLLBACK_DIR"
    return 1
  }
  ROLLBACK_DIR=""
}

capture_previous_image() {
  local rollback_dir="$1" container_names
  if ! container_names="$(docker container ls --all --filter 'name=^/toeic-green-api$' --format '{{.Names}}')"; then
    die "Could not inspect existing API containers"
    return 1
  fi
  PREVIOUS_IMAGE=""
  if grep -Fxq toeic-green-api <<< "$container_names"; then
    if ! PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' toeic-green-api)"; then
      die "Could not inspect the previous API image"
      return 1
    fi
    [[ -n "$PREVIOUS_IMAGE" ]] || {
      die "Previous API container reported an empty image"
      return 1
    }
  fi
  printf '%s\n' "$PREVIOUS_IMAGE" > "$rollback_dir/previous-image"
  chmod 600 "$rollback_dir/previous-image"
}

replace_backend_environment() {
  local renderer="$1" aws_region="$2" runtime_dir="$3"
  DEPLOY_PHASE=env_replaced
  AWS_REGION="$aws_region" RUNTIME_DIR="$runtime_dir" "$renderer"
}

restore_previous_env() {
  local target="$1" snapshot="$2" had_previous="$3"
  if [[ "$had_previous" == true ]]; then
    cp "$snapshot" "$target"
    chmod 600 "$target"
  else
    rm -f "$target"
  fi
}

restore_previous_checkout() {
  local repo_dir="$1" previous_head="$2"
  [[ -n "$repo_dir" && -n "$previous_head" ]] || return 0
  if ! git -C "$repo_dir" checkout --detach "$previous_head"; then
    die "Could not restore previous repository checkout $previous_head"
    return 1
  fi
}

wait_for_api_ready() {
  local attempts="${READINESS_ATTEMPTS:-24}"
  local interval="${READINESS_INTERVAL_SECONDS:-5}"
  local attempt status
  for ((attempt = 1; attempt <= attempts; attempt++)); do
    status="$(docker inspect --format '{{.State.Health.Status}}' toeic-green-api 2>/dev/null || true)"
    if [[ "$status" == healthy ]]; then
      return 0
    fi
    sleep "$interval"
  done
  return 1
}

rollback_candidate() {
  local previous_image="$1" env_snapshot="$2" previous_compose="$3"
  local previous_head="$4" repo_dir="$5"
  local env_target="${RUNTIME_DIR:?RUNTIME_DIR is required}/backend.env"
  local had_previous_env="${HAD_PREVIOUS_ENV:-true}"
  local restored=true

  if ! restore_previous_env "$env_target" "$env_snapshot" "$had_previous_env"; then
    restored=false
  elif [[ -n "$previous_image" ]]; then
    [[ -f "$previous_compose" ]] || {
      die "Previous Compose runtime definition is unavailable; recovery snapshot was preserved"
      restored=false
    }
    if [[ "$restored" == true ]]; then
      export API_IMAGE="$previous_image"
    fi
    if [[ "$restored" == true ]] && ! docker compose -f "$previous_compose" \
      up -d --no-deps --no-build --force-recreate api; then
      die "Rollback could not restart previous API image $previous_image"
      restored=false
    elif [[ "$restored" == true ]] && ! wait_for_api_ready; then
      docker logs --tail 100 toeic-green-api >&2 || true
      die "Rollback image $previous_image did not become ready"
      restored=false
    else
      [[ "$restored" == true ]] && log "Rollback restored the previous API release"
    fi
  else
    docker compose -f "${COMPOSE_FILE:?COMPOSE_FILE is required}" rm -sf api || true
    warn "Candidate failed and no previous API release exists; failed candidate was removed"
  fi
  restore_previous_checkout "$repo_dir" "$previous_head" || restored=false
  [[ "$restored" == true ]]
}

activate_candidate() {
  if ! docker compose -f "${COMPOSE_FILE:?COMPOSE_FILE is required}" \
    up -d --no-deps --force-recreate api; then
    die "Candidate API could not be started"
    return 1
  fi
  if ! wait_for_api_ready; then
    docker logs --tail 100 toeic-green-api >&2 || true
    die "Candidate API did not become ready"
    return 1
  fi
}

verify_public_hosts() {
  local host
  (( ${#API_HOST_ARRAY[@]} > 0 )) || {
    die "API_HOSTS has not been parsed"
    return 1
  }
  for host in "${API_HOST_ARRAY[@]}"; do
    curl --fail --silent --show-error --max-time 15 "https://$host/api/health/live" >/dev/null || {
      die "Public liveness check failed for https://$host/api/health/live"
      return 1
    }
    curl --fail --silent --show-error --max-time 15 "https://$host/api/health/ready" >/dev/null || {
      die "Public readiness check failed for https://$host/api/health/ready"
      return 1
    }
  done
}

reload_caddy() {
  if ! docker compose -f "${COMPOSE_FILE:?COMPOSE_FILE is required}" run --rm --no-deps caddy \
    caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
    die "Caddy configuration is invalid; healthy candidate API was preserved"
    return 1
  fi
  if ! docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate caddy; then
    die "Caddy failed to start; healthy candidate API was preserved"
    return 1
  fi
}

cleanup_images() {
  local current_image="$1" rollback_image="$2" image
  while IFS= read -r image; do
    [[ -z "$image" || "$image" == "$current_image" || "$image" == "$rollback_image" ]] && continue
    docker image rm "$image" >/dev/null 2>&1 || true
  done < <(docker images 'toeic-green-api' --format '{{.Repository}}:{{.Tag}}')
  while IFS= read -r image; do
    [[ -z "$image" || "$image" == "toeic-green-migrator:${IMAGE_TAG:?IMAGE_TAG is required}" ]] && continue
    docker image rm "$image" >/dev/null 2>&1 || true
  done < <(docker images 'toeic-green-migrator' --format '{{.Repository}}:{{.Tag}}')
  if ! docker builder prune --force --filter 'until=168h' >/dev/null; then
    warn "BuildKit cache pruning failed; deployment remains successful"
  fi
}

handle_transaction_failure() {
  local restored=true
  case "$DEPLOY_PHASE" in
    release_checkout)
      restore_previous_checkout "$REPO_DIR" "$PREVIOUS_HEAD" || restored=false
      ;;
    env_replaced)
      restore_previous_env "$ENV_TARGET" "$ENV_SNAPSHOT" "$HAD_PREVIOUS_ENV" || restored=false
      restore_previous_checkout "$REPO_DIR" "$PREVIOUS_HEAD" || restored=false
      ;;
    candidate_started)
      rollback_candidate "$PREVIOUS_IMAGE" "$ENV_SNAPSHOT" "$PREVIOUS_COMPOSE_FILE" \
        "$PREVIOUS_HEAD" "$REPO_DIR" || restored=false
      ;;
    api_healthy)
      warn "Deployment failed after API readiness; healthy candidate was preserved for routing diagnosis"
      warn "Recovery snapshot retained at $ROLLBACK_DIR"
      return 0
      ;;
  esac
  if [[ "$restored" == true ]]; then
    cleanup_transaction_snapshot || true
  else
    warn "Automatic recovery was incomplete; recovery snapshot retained at $ROLLBACK_DIR"
    return 1
  fi
}

on_deploy_exit() {
  local status=$?
  trap - EXIT INT TERM
  if (( status != 0 )); then
    handle_transaction_failure || status=1
  fi
  exit "$status"
}

on_deploy_signal() {
  local status="$1"
  trap - EXIT INT TERM
  handle_transaction_failure || true
  exit "$status"
}

install_transaction_traps() {
  trap 'on_deploy_exit' EXIT
  trap 'on_deploy_signal 130' INT
  trap 'on_deploy_signal 143' TERM
}

main() {
  local runtime_dir="${RUNTIME_DIR:-/opt/toeic-green/runtime}"
  local aws_region="${AWS_REGION:-ap-northeast-1}"
  local repository_branch="${REPOSITORY_BRANCH:-main}"
  local deploy_sha="${DEPLOY_SHA:?DEPLOY_SHA is required}"
  local api_hosts="${API_HOSTS:?API_HOSTS is required}"
  local resolved_sha render_env

  REPO_DIR="${REPO_DIR:-/opt/toeic-green/repo}"
  parse_api_hosts "$api_hosts"
  acquire_deploy_lock "$runtime_dir"
  prepare_transaction_snapshot "$REPO_DIR" "$runtime_dir"
  install_transaction_traps
  capture_previous_image "$ROLLBACK_DIR"

  DEPLOY_PHASE=release_checkout
  if ! resolved_sha="$(verify_release "$REPO_DIR" "$repository_branch" "$deploy_sha")"; then
    return 1
  fi
  export IMAGE_TAG="${resolved_sha:0:12}"
  export API_IMAGE="toeic-green-api:$IMAGE_TAG"
  export API_HOSTS="$API_HOSTS_NORMALIZED"
  export RUNTIME_DIR="$runtime_dir"
  export COMPOSE_FILE="$REPO_DIR/back-end/deploy/aws/compose.yml"
  render_env="$REPO_DIR/back-end/deploy/aws/render-env.sh"

  if ! replace_backend_environment "$render_env" "$aws_region" "$runtime_dir"; then
    return 1
  fi

  if ! docker compose -f "$COMPOSE_FILE" build api migrator; then
    die "Image build failed; previous API was left serving"
    return 1
  fi

  # Database migrations must follow expand/contract compatibility: the old API
  # remains live against the migrated schema until the candidate is ready.
  if ! docker compose -f "$COMPOSE_FILE" run --rm migrator; then
    die "Migration failed; previous API and environment will be restored"
    return 1
  fi

  DEPLOY_PHASE=candidate_started
  activate_candidate || return 1
  DEPLOY_PHASE=api_healthy

  reload_caddy || return 1
  verify_public_hosts || return 1

  DEPLOY_PHASE=committed
  cleanup_transaction_snapshot || true
  cleanup_images "$API_IMAGE" "$PREVIOUS_IMAGE"
  log "Deployed $API_IMAGE and verified $API_HOSTS_NORMALIZED"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
