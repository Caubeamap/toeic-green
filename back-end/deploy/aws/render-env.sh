#!/usr/bin/env bash
set -euo pipefail
umask 077

required=(
  JWT_SECRET JWT_REFRESH_SECRET DATABASE_URL DIRECT_URL REDIS_URL
  R2_ACCOUNT_ID R2_ACCESS_KEY R2_SECRET_KEY RESEND_API_KEY
  GOOGLE_CLIENT_SECRET
)

compose_quote() {
  local key="$1" value="$2"
  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    printf 'Cannot represent SSM parameter %s safely in a Compose env file\n' "$key" >&2
    return 1
  fi
  value="${value//\'/\\\'}"
  printf "'%s'" "$value"
}

validate_encoded_value() {
  local key="$1" encoded="$2" bytes
  if ! bytes="$(printf '%s' "$encoded" | base64 --decode | od -An -t u1)"; then
    printf 'Could not decode SSM parameter %s\n' "$key" >&2
    return 1
  fi
  if [[ " $bytes " =~ [[:space:]](0|10|13)[[:space:]] ]]; then
    printf 'Cannot represent SSM parameter %s safely in a Compose env file\n' "$key" >&2
    return 1
  fi
}

write_env_file() {
  local target="$1" key value temp
  shift
  local -A supplied=()

  (( $# % 2 == 0 )) || {
    printf 'Environment key/value arguments are unbalanced\n' >&2
    return 1
  }
  while (( $# > 0 )); do
    key="$1"
    value="$2"
    shift 2
    compose_quote "$key" "$value" >/dev/null || return 1
    supplied["$key"]="$value"
  done
  for key in "${required[@]}"; do
    [[ -v "supplied[$key]" ]] || {
      printf 'Missing SSM parameter: %s\n' "$key" >&2
      return 1
    }
  done

  mkdir -p "$(dirname "$target")"
  temp="$(mktemp "${target}.tmp.XXXXXX")"
  chmod 600 "$temp"
  trap '[[ -z "${temp:-}" ]] || rm -f "$temp"' RETURN
  if ! {
    cat <<'ENV'
NODE_ENV=production
PORT=2409
FRONTEND_URL=https://toeicgreen.com
CORS_ALLOWED_ORIGINS=https://www.toeicgreen.com
TRUST_PROXY=1
COOKIE_SECURE=true
COOKIE_DOMAIN=.toeicgreen.com
DB_POOL_MAX=5
MAIL_PROVIDER=resend
EMAIL_FROM='TOEIC Green <no-reply@toeicgreen.com>'
EMAIL_VERIFICATION_URL=https://toeicgreen.com/verify-email
EMAIL_RESET_PASSWORD_URL=https://toeicgreen.com/forgot-password
GOOGLE_CLIENT_ID=739130230350-ett9c8812jardb9a5jaagpjuu5cdhl7n.apps.googleusercontent.com
R2_BUCKET_NAME=toeic-green-assets
R2_PUBLIC_URL=https://pub-4f8cb610d7574526affd8f9e156e874e.r2.dev
ENV
    for key in "${required[@]}"; do
      printf '%s=' "$key"
      compose_quote "$key" "${supplied[$key]}"
      printf '\n'
    done
  } > "$temp"; then
    rm -f "$temp"
    temp=""
    return 1
  fi
  if ! mv -f "$temp" "$target"; then
    rm -f "$temp"
    temp=""
    trap - RETURN
    return 1
  fi
  temp=""
  trap - RETURN
}

main() {
  local aws_region="${AWS_REGION:-ap-northeast-1}"
  local parameter_path="${PARAMETER_PATH:-/toeic-green/prod/}"
  local runtime_dir="${RUNTIME_DIR:-/opt/toeic-green/runtime}"
  local target="$runtime_dir/backend.env" temp_json key encoded value
  local -a pairs=()

  mkdir -p "$runtime_dir"
  temp_json="$(mktemp "$runtime_dir/ssm.XXXXXX.json")"
  chmod 600 "$temp_json"
  trap "rm -f -- $(printf '%q' "$temp_json")" EXIT

  aws ssm get-parameters-by-path \
    --path "$parameter_path" \
    --recursive \
    --with-decryption \
    --region "$aws_region" \
    --output json > "$temp_json"

  for key in "${required[@]}"; do
    if ! jq -e --arg name "${parameter_path}${key}" \
      '[.Parameters[] | select(.Name == $name)] | length == 1' "$temp_json" >/dev/null; then
      printf 'Missing or duplicate SSM parameter: %s%s\n' "$parameter_path" "$key" >&2
      return 1
    fi
    encoded="$(jq -er --arg name "${parameter_path}${key}" \
      '.Parameters[] | select(.Name == $name) | .Value | @base64' "$temp_json")"
    validate_encoded_value "$key" "$encoded" || return 1
    value="$(printf '%s' "$encoded" | base64 --decode)"
    pairs+=("$key" "$value")
  done

  write_env_file "$target" "${pairs[@]}"
  printf 'Rendered %s with required production variables\n' "$target"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
