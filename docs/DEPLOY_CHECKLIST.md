# Checklist Deploy Production — TOEIC Green

> Cập nhật 2026-06-20. Đánh dấu: ✅ đã có/đã làm · ⬜ phải set/làm khi deploy · 🔴 blocker.

> **Trạng thái env backend: ĐÃ SETUP ĐẦY ĐỦ trong `back-end/.env.production`** (gitignored).
> `back-end/.env` giữ nguyên cho **local dev**. Trên Cloud Run, biến đến từ
> `deploy/deploy-cloudrun.sh` (`--set-env-vars`) + Secret Manager (`deploy/create-secrets.sh`),
> KHÔNG đọc file `.env`. Mọi giá trị `localhost` đã được đổi sang link production.

## 1. Biến môi trường BACKEND — đã cấu hình trong `.env.production`

| Biến | Bắt buộc | Trạng thái | Ghi chú |
|---|---|---|---|
| `NODE_ENV=production` | 🔴 | ✅ | Bật validation + cookie `secure`. |
| `JWT_SECRET` | 🔴 | ✅ (secret mạnh) | Ngẫu nhiên ≥32 ký tự, KHÁC refresh. App **từ chối** placeholder `.env.example`. |
| `JWT_REFRESH_SECRET` | 🔴 | ✅ | Khác `JWT_SECRET`. Đổi secret = logout toàn bộ phiên. |
| `DATABASE_URL` | 🔴 | ✅ | Supabase pooler (`...:6543?pgbouncer=true`) cho runtime. |
| `DIRECT_URL` | ⬜ | ✅ | Cổng 5432 — dùng cho `prisma migrate`. |
| `DB_POOL_MAX=5` | ⬜ | ✅ | Pool/instance. Tổng = 5 × max-instances. |
| `REDIS_URL` | 🔴 | ✅ | Upstash thật. Bắt buộc ở prod để rate-limit chia sẻ giữa instance. |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY` / `R2_SECRET_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | 🔴 | ✅ | Cloudflare R2. |
| `FRONTEND_URL` | 🔴 | ✅ | `https://toeicgreen.com` (đã đổi từ localhost). |
| `CORS_ALLOWED_ORIGINS` | ⬜ | ✅ | `https://www.toeicgreen.com`. |
| `TRUST_PROXY=1` | 🔴 | ✅ | Sau Cloud Run/CDN — lấy IP thật cho rate-limit. |
| `COOKIE_SECURE=true` | 🔴 | ✅ | Cookie refresh chỉ gửi qua HTTPS. |
| `COOKIE_DOMAIN=.toeicgreen.com` | 🔴 | ✅ | Cookie refresh dùng chung cho frontend SSR và API subdomain. |
| `MAIL_PROVIDER=resend` + `RESEND_API_KEY` | 🔴 | ✅ | Key thật. |
| `EMAIL_FROM` | 🔴 | ✅ | `no-reply@toeicgreen.com` — domain phải **verify trong Resend** (mục 4). |
| `EMAIL_VERIFICATION_URL` | 🔴 | ✅ | `https://toeicgreen.com/verify-email` (đã đổi từ localhost). |
| `GOOGLE_CLIENT_ID` | 🔴 | ✅ | Khớp Client ID phía FE. |
| `GITHUB_*` | — | bỏ qua | Chưa dùng — đã comment trong `.env.production`. |

## 2. Biến môi trường FRONTEND (build-time `NEXT_PUBLIC_*`)

| Biến | Trạng thái | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ⬜ | URL API prod, vd `https://api.toeicgreen.com/api`. |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | ⬜ | Origin R2 công khai (khớp `R2_PUBLIC_URL`). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | Cùng giá trị với BE `GOOGLE_CLIENT_ID`. |

> Lưu ý: `NEXT_PUBLIC_*` nhúng vào bundle lúc **build** → phải set TRƯỚC `next build`, đổi giá trị phải build lại.

> ✅ Cả 3 biến `NEXT_PUBLIC_*` đã set trong Vercel (Production):
> `NEXT_PUBLIC_API_URL=https://api.toeicgreen.com/api`,
> `NEXT_PUBLIC_MEDIA_ORIGIN=https://pub-4f8cb610d7574526affd8f9e156e874e.r2.dev`,
> `NEXT_PUBLIC_GOOGLE_CLIENT_ID=739130230350-...`.

## 3. Hạ tầng & domain

- ✅ Backend deploy **cùng vùng Supabase** (Cloud Run `asia-northeast1` ↔ Supabase `ap-northeast-1`).
- ✅ DB prod up-to-date — 12/12 migration đã apply (`prisma migrate status`: schema up to date). Không có migration treo.
- ✅ Frontend và API **cùng registrable domain** (`toeicgreen.com` ↔ `api.toeicgreen.com`) → cookie `sameSite:strict` gửi được.
- ⬜ (Tùy chọn) `www.toeicgreen.com`: đã có `CNAME www → toeicgreen.com` ở Hostinger và `www` nằm trong `CORS_ALLOWED_ORIGINS`, nhưng **chưa Add `www` trong Vercel** → muốn www chạy thì thêm trong Vercel (redirect về apex).

## 4. Dịch vụ ngoài

- ✅ Google OAuth: Authorized JS origins đã có `https://toeicgreen.com`, `https://www.toeicgreen.com`; app đã Publish (In production).
- ✅ Resend: domain `toeicgreen.com` đã verify, gửi email từ `no-reply@toeicgreen.com` hoạt động.
- ✅ Upstash Redis, Cloudflare R2: đã cấu hình.

## 5. Build & smoke trước khi mở cho người dùng

- ✅ Backend build → 0 issues (TSC + SWC; Cloud Build trên Cloud Run thành công).
- ✅ Frontend build → thành công (Vercel build OK, đã set đủ `NEXT_PUBLIC_*`).
- ✅ Smoke API trên domain thật: `GET https://api.toeicgreen.com/api/practice/tests` → 200 + data.
- ✅ Rate-limit hoạt động (response có header `x-ratelimit-limit: 100`, Redis-backed). Stack trace ẩn theo thiết kế (PrismaClientExceptionFilter + NODE_ENV=production).
- ✅ **Test end-to-end trên trình duyệt thật** (`https://toeicgreen.com`): đăng nhập mật khẩu + Google chạy, giữ phiên. Xác nhận 2026-06-20.

---

### Trạng thái env: ĐÃ SETUP (2026-06-20)
- ✅ Toàn bộ biến backend production nằm trong `back-end/.env.production` (localhost → link production).
- ✅ `back-end/.env` giữ cho local dev; `.gitignore` đã chặn mọi `.env*` trừ `.env.example`.
- ✅ Deploy script đã nhúng sẵn config không bí mật; `create-secrets.sh .env.production` đẩy secret lên Secret Manager.

### 🎉 HỆ THỐNG ĐÃ LIVE (2026-06-20)

**Backend — Google Cloud Run**
- ✅ Project `toeic-green`, region `asia-northeast1` (cùng vùng Supabase).
- ✅ Domain: `https://api.toeicgreen.com` (CNAME → ghs.googlehosted.com, SSL cấp tự động).
- ✅ URL run.app: `https://toeic-green-api-739130230350.asia-northeast1.run.app`
- ✅ SA riêng `toeic-api@toeic-green.iam.gserviceaccount.com` (chỉ quyền đọc secret).
- ✅ min-instances 1, cpu 1, 512Mi, 9 secret qua Secret Manager.
- ✅ Smoke `GET https://api.toeicgreen.com/api/practice/tests` → 200 + data; rate-limit (Redis) + helmet + CORS hoạt động.

**Frontend — Vercel**
- ✅ Project `english-usuk-system`, root `front-end`, Next.js.
- ✅ Domain: `https://toeicgreen.com` (A @ → 216.198.79.1), Valid Configuration.
- ✅ Env `NEXT_PUBLIC_API_URL=https://api.toeicgreen.com/api`, `NEXT_PUBLIC_MEDIA_ORIGIN`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

**Dịch vụ ngoài**: Supabase (pooler) ✅ · Upstash Redis ✅ · Cloudflare R2 ✅ · Resend (domain verified) ✅ · Google OAuth (origins + published) ✅

### 🚀 HỆ THỐNG HOÀN TẤT (2026-06-20)
- ✅ Backend (Cloud Run) + Frontend (Vercel) + domain + Google login đều LIVE và đã test thật.
- ✅ Đăng nhập Google dùng **authorization-code flow** + nút tự vẽ generic ("Đăng nhập bằng Google", không cá nhân hoá). Backend đổi code→token rồi tái dùng `verifyIdToken`; endpoint vẫn nhận `credential` cũ (tương thích ngược).

### Việc còn lại (đều tùy chọn)
1. ⬜ **Bảo mật**: `GOOGLE_CLIENT_SECRET` từng dán qua chat → nên tạo secret mới (Add secret → cập nhật `.env`/`.env.production` → `create-secrets.sh` → redeploy) cho an toàn tuyệt đối.
2. ⬜ Thêm `www.toeicgreen.com` trong Vercel nếu muốn www chạy.
3. ⬜ Đổi `--min-instances 1` → `0` để tiết kiệm chi phí lúc ít user (đánh đổi cold-start).
