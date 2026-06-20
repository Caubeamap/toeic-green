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

> Hai biến `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_MEDIA_ORIGIN` chưa set vì phụ thuộc domain
> API cuối cùng (`api.toeicgreen.com` sau khi map ở mục 3). Giá trị khuyến nghị:
> `NEXT_PUBLIC_API_URL=https://api.toeicgreen.com/api`,
> `NEXT_PUBLIC_MEDIA_ORIGIN=https://pub-4f8cb610d7574526affd8f9e156e874e.r2.dev`.

## 3. Hạ tầng & domain

- ⬜ Deploy backend **cùng vùng Supabase** (`ap-northeast-1` → Cloud Run `asia-northeast1`). Xem `CLOUD_RUN_DEPLOY.md`.
- ⬜ `prisma migrate deploy` trên DB prod (hiện schema đã up-to-date — 12/12 migration).
- ⬜ Frontend và API **cùng registrable domain** (vd `toeicgreen.com` ↔ `api.toeicgreen.com`) để cookie `sameSite:strict` hoạt động. Nếu khác domain hẳn → cookie refresh sẽ không gửi.
- ⬜ Nếu phục vụ cả `www` lẫn apex: hoặc redirect `www`→apex ở CDN, hoặc thêm vào `CORS_ALLOWED_ORIGINS`.

## 4. Dịch vụ ngoài

- ✅ Google OAuth: Authorized JS origins đã có `https://toeicgreen.com`, `https://www.toeicgreen.com`; app đã Publish (In production).
- ✅ Resend: domain `toeicgreen.com` đã verify, gửi email từ `no-reply@toeicgreen.com` hoạt động.
- ✅ Upstash Redis, Cloudflare R2: đã cấu hình.

## 5. Build & smoke trước khi mở cho người dùng

- ⬜ `npm --prefix back-end run build` → 0 issues.
- ⬜ `npm --prefix front-end run build` → thành công (đã set đủ `NEXT_PUBLIC_*`).
- ⬜ Khởi động prod, kiểm: đăng nhập mật khẩu + Google, refresh phiên, upload avatar, làm 1 đề + xem lại kết quả, bình luận.
- ⬜ Xác nhận response KHÔNG lộ stack trace; rate-limit hoạt động (đăng nhập sai nhiều lần → 429).

---

### Trạng thái env: ĐÃ SETUP (2026-06-20)
- ✅ Toàn bộ biến backend production nằm trong `back-end/.env.production` (localhost → link production).
- ✅ `back-end/.env` giữ cho local dev; `.gitignore` đã chặn mọi `.env*` trừ `.env.example`.
- ✅ Deploy script đã nhúng sẵn config không bí mật; `create-secrets.sh .env.production` đẩy secret lên Secret Manager.

### Blocker còn lại (thuần vận hành khi bấm deploy)
1. Deploy backend lên Cloud Run (xem `CLOUD_RUN_DEPLOY.md`).
2. Map custom domain `api.toeicgreen.com` vào Cloud Run (để cookie `sameSite:strict` chạy).
3. Set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_MEDIA_ORIGIN` khi build frontend.
4. `prisma migrate deploy` lên DB prod (hiện đã up-to-date).

✅ Resend đã verify (2026-06-20).
