#!/usr/bin/env bash
# Đẩy các giá trị bí mật lên Google Secret Manager.
# Chạy TỪ thư mục back-end:  bash deploy/create-secrets.sh [ENV_FILE]
#   ENV_FILE mặc định .env.production (dùng .env nếu muốn: bash deploy/create-secrets.sh .env)
# Yêu cầu: đã `gcloud auth login` và `gcloud config set project <PROJECT_ID>`.
set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [ ! -f "./${ENV_FILE}" ]; then
  echo "Không thấy ./${ENV_FILE} — hãy chạy script này từ thư mục back-end." >&2
  exit 1
fi

# Nạp KEY="value" từ env file vào môi trường (không in ra giá trị).
set -a
# shellcheck disable=SC1091
source "./${ENV_FILE}"
set +a

# Chỉ những biến THỰC SỰ là bí mật mới đưa vào Secret Manager.
SECRETS=(
  JWT_SECRET
  JWT_REFRESH_SECRET
  DATABASE_URL
  DIRECT_URL
  REDIS_URL
  R2_ACCOUNT_ID
  R2_ACCESS_KEY
  R2_SECRET_KEY
  RESEND_API_KEY
)

for name in "${SECRETS[@]}"; do
  value="${!name:-}"
  if [ -z "$value" ]; then
    echo "BỎ QUA $name (rỗng trong .env)"
    continue
  fi
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- >/dev/null
    echo "đã cập nhật version mới: $name"
  else
    printf '%s' "$value" | gcloud secrets create "$name" \
      --replication-policy=automatic --data-file=- >/dev/null
    echo "đã tạo: $name"
  fi
done

echo "Hoàn tất. Nhớ cấp quyền secretAccessor cho service account của Cloud Run (xem CLOUD_RUN_DEPLOY.md)."
