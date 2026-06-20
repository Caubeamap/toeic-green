# Deploy Backend lên Google Cloud Run

> Kiến trúc: **Cloud Run** (backend NestJS) + **Supabase** (Postgres, pooler) +
> **Upstash** (Redis) + **Cloudflare R2** (media). Mục tiêu: phản hồi nhanh, scale nhiều user.

## 0. Quyết định kiến trúc quan trọng (đọc trước)

- **Vùng (region):** đặt Cloud Run ở `asia-northeast1` (Tokyo) để **cùng vùng** với Supabase
  `ap-northeast-1` → round-trip DB thấp nhất. Khác vùng = chậm rõ rệt.
- **Custom domain cho API (BẮT BUỘC để auth chạy):** cookie refresh dùng `sameSite=strict`,
  chỉ gửi khi API và frontend **cùng registrable domain**. Vì vậy map API vào
  `api.toeicgreen.com` (cùng `toeicgreen.com` với frontend). Nếu để URL mặc định
  `*.run.app` (khác domain) → trình duyệt KHÔNG gửi cookie refresh → đăng nhập/refresh hỏng.
  (Phương án thay thế nếu buộc dùng `*.run.app`: đổi cookie sang `sameSite=lax` hoặc `none` —
  nhưng nên dùng custom domain.)
- **Kết nối DB:** runtime dùng `DATABASE_URL` = **pooler** Supabase (cổng `6543`, `pgbouncer=true`);
  migrations dùng `DIRECT_URL` (cổng `5432`). Cả hai đã có trong `.env`.

## 1. Chuẩn bị GCP (một lần)

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>

# Bật API
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com artifactregistry.googleapis.com
```

> Deploy dùng `gcloud run deploy --source .` nên Artifact Registry repo
> (`cloud-run-source-deploy`) được **tạo tự động** — không cần tạo thủ công.

## 2. Đẩy bí mật lên Secret Manager

Các giá trị bí mật KHÔNG đặt thẳng vào lệnh deploy. Script đọc từ `back-end/.env`:

```bash
cd back-end
bash deploy/create-secrets.sh
```

Tạo các secret: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `DIRECT_URL`,
`REDIS_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `RESEND_API_KEY`.

Cấp quyền cho service account của Cloud Run đọc secret (mặc định là Compute SA):

```bash
PROJECT_NUMBER=$(gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 3. Biến môi trường (đã cấu hình sẵn trong deploy script)

**Không bí mật** (đặt qua `--set-env-vars`):

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `NODE_ENV` | `production` | Bật env validation + cookie secure |
| `FRONTEND_URL` | `https://toeicgreen.com` | URL canonical (CORS + link email) |
| `CORS_ALLOWED_ORIGINS` | `https://www.toeicgreen.com` | Origin phụ (apex đã có ở FRONTEND_URL) |
| `TRUST_PROXY` | `1` | Sau Cloud Run/CDN — lấy IP thật cho rate-limit |
| `COOKIE_SECURE` | `true` | HTTPS |
| `DB_POOL_MAX` | `5` | Pool/instance. Tổng = 5 × max-instances (xem mục 5) |
| `MAIL_PROVIDER` | `resend` | |
| `EMAIL_FROM` | `TOEIC Green <no-reply@toeicgreen.com>` | Domain phải verify trong Resend |
| `EMAIL_VERIFICATION_URL` | `https://toeicgreen.com/verify-email` | |
| `GOOGLE_CLIENT_ID` | `739130230350-...` | Công khai, khớp FE |
| `R2_BUCKET_NAME` | `toeic-green-assets` | |
| `R2_PUBLIC_URL` | `https://pub-4f8cb610...r2.dev` | URL công khai CDN |

> **KHÔNG đặt `PORT`** — Cloud Run tự cấp `PORT` và app đã đọc `process.env.PORT`.

**Bí mật** (qua `--set-secrets`, trỏ tới Secret Manager): xem mục 2.

## 4. Deploy

```bash
cd back-end
# Mở deploy/deploy-cloudrun.sh, sửa PROJECT_ID, rồi:
bash deploy/deploy-cloudrun.sh
```

Script sẽ build image (Cloud Build) và `gcloud run deploy` với toàn bộ env + secrets ở trên.

## 5. Cấu hình hiệu năng & kết nối (đã set trong script)

| Cờ | Giá trị | Lý do |
|---|---|---|
| `--min-instances` | `1` | Luôn có 1 instance ấm → **không cold start** (phản hồi nhanh). Tốn phí 1 instance chạy liên tục. |
| `--max-instances` | `10` | Chặn trần để tổng connection DB không vượt pooler. |
| `--cpu` / `--memory` | `1` / `512Mi` | Đủ cho NestJS; tăng nếu tải nặng. |
| `--concurrency` | `80` | Số request đồng thời mỗi instance. |
| `--cpu-boost` | bật | Tăng CPU lúc khởi động → cold start nhanh hơn. |

**Quan hệ connection ↔ scale:** mỗi instance mở tối đa `DB_POOL_MAX` connection.
Tổng tối đa = `DB_POOL_MAX × max-instances` = `5 × 10 = 50` client tới pooler Supabase
(transaction mode chịu được). Nếu tăng `max-instances`, cân nhắc giảm `DB_POOL_MAX`
tương ứng để không cạn pooler.

## 6. Custom domain cho API (cùng domain frontend)

```bash
gcloud beta run domain-mappings create \
  --service toeic-green-api --domain api.toeicgreen.com --region asia-northeast1
```

Sau đó thêm bản ghi DNS theo hướng dẫn lệnh in ra. Khi xong, frontend gọi
`https://api.toeicgreen.com/api`.

## 7. Migrations (chạy RIÊNG, không trong container start)

Không để container tự `migrate` lúc khởi động (nhiều instance sẽ đua nhau). Chạy thủ công
hoặc trong CI trước/sau deploy, dùng `DIRECT_URL`:

```bash
cd back-end
npx prisma migrate deploy   # đọc DIRECT_URL từ .env / môi trường CI
```

(Hiện schema đã up-to-date: 12/12 migration.)

## 8. Frontend (đặt khi build FE — KHÔNG ở Cloud Run)

| Biến | Giá trị |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.toeicgreen.com/api` |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | `https://pub-4f8cb610...r2.dev` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `739130230350-...` |

`NEXT_PUBLIC_*` nhúng vào bundle lúc build → phải set TRƯỚC `next build`.

## 9. Smoke sau deploy

```bash
# Health: gọi 1 endpoint public
curl -i https://api.toeicgreen.com/api/practice/tests
```

Kiểm trên trình duyệt thật: đăng nhập mật khẩu + Google, refresh phiên (F5), upload avatar,
làm 1 đề + xem lại, bình luận. Xác nhận rate-limit (đăng nhập sai nhiều lần → 429) và
response không lộ stack trace.

---

### Lưu ý bảo mật
- `back-end/.env` đã gitignore — KHÔNG commit. Hai script trong `deploy/` không chứa giá trị
  bí mật (đọc từ `.env` / Secret Manager).
- Bí mật chỉ sống ở Secret Manager; Cloud Run nạp lúc chạy. Xoay secret = thêm version mới
  rồi deploy lại (hoặc trỏ `:latest`).
