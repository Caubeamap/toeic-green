#!/usr/bin/env bash
# Build image + deploy backend lên Google Cloud Run.
# Chạy TỪ thư mục back-end:  bash deploy/deploy-cloudrun.sh
# Yêu cầu: đã chạy create-secrets.sh và đã bật các API cần thiết (xem CLOUD_RUN_DEPLOY.md).
set -euo pipefail

# ─────────── CHỈNH CÁC GIÁ TRỊ NÀY ───────────
PROJECT_ID="CHANGE_ME"                 # ID project GCP
REGION="asia-northeast1"               # Tokyo — CÙNG vùng Supabase ap-northeast-1 để giảm latency
SERVICE="toeic-green-api"
REPO="toeic-green"                     # Artifact Registry repo (tạo trước nếu chưa có)
# ──────────────────────────────────────────────

TAG="$(git rev-parse --short HEAD 2>/dev/null || echo manual)"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG}"

echo "Building & pushing $IMAGE ..."
gcloud builds submit --project "$PROJECT_ID" --tag "$IMAGE" .

echo "Deploying $SERVICE ..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --cpu-boost \
  --set-env-vars "^|^NODE_ENV=production|FRONTEND_URL=https://toeicgreen.com|CORS_ALLOWED_ORIGINS=https://www.toeicgreen.com|TRUST_PROXY=1|COOKIE_SECURE=true|DB_POOL_MAX=5|MAIL_PROVIDER=resend|EMAIL_FROM=TOEIC Green <no-reply@toeicgreen.com>|EMAIL_VERIFICATION_URL=https://toeicgreen.com/verify-email|GOOGLE_CLIENT_ID=739130230350-ett9c8812jardb9a5jaagpjuu5cdhl7n.apps.googleusercontent.com|R2_BUCKET_NAME=toeic-green-assets|R2_PUBLIC_URL=https://pub-4f8cb610d7574526affd8f9e156e874e.r2.dev" \
  --set-secrets "JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,REDIS_URL=REDIS_URL:latest,R2_ACCOUNT_ID=R2_ACCOUNT_ID:latest,R2_ACCESS_KEY=R2_ACCESS_KEY:latest,R2_SECRET_KEY=R2_SECRET_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest"

echo "Xong. Lấy URL service:"
gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format 'value(status.url)'
