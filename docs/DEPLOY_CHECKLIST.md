# Checklist Deploy Production — TOEIC Green

> Cập nhật 2026-06-20. Đánh dấu: ✅ đã có/đã làm · ⬜ phải set/làm khi deploy · 🔴 blocker.

## 1. Biến môi trường BACKEND (set trên host prod, KHÔNG commit)

| Biến | Bắt buộc | Trạng thái | Ghi chú |
|---|---|---|---|
| `NODE_ENV=production` | 🔴 | ⬜ | Bật validation + cookie `secure` mặc định. Thiếu → chạy như dev. |
| `JWT_SECRET` | 🔴 | ✅ (đã thay secret mạnh) | Chuỗi ngẫu nhiên ≥32 ký tự, KHÁC refresh. App nay **từ chối** placeholder `.env.example`. |
| `JWT_REFRESH_SECRET` | 🔴 | ✅ | Khác `JWT_SECRET`. Đổi secret = logout toàn bộ phiên. |
| `DATABASE_URL` | 🔴 | ✅ | Supabase pooler (`...pooler.supabase.com:6543?pgbouncer=true`) cho app. |
| `DIRECT_URL` | ⬜ | ✅ | Cổng 5432 trực tiếp — dùng cho `prisma migrate`. |
| `REDIS_URL` | 🔴 | ✅ | Upstash thật (`rediss://...upstash.io:6379`). Bắt buộc ở prod để rate-limit chia sẻ giữa các instance. |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY` / `R2_SECRET_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | 🔴 | ✅ | Cloudflare R2 — media + avatar. |
| `FRONTEND_URL` | 🔴 | ⬜ (đang localhost) | Đặt `https://toeicgreen.com` (URL canonical, dùng cho CORS + link). |
| `CORS_ALLOWED_ORIGINS` | ⬜ | ⬜ | Origin phụ phân tách dấu phẩy, vd `https://www.toeicgreen.com`. Bỏ trống nếu chỉ 1 domain. |
| `TRUST_PROXY=1` | 🔴 | ⬜ | Sau Cloudflare/CDN. Thiếu → mọi user gom 1 IP → rate-limit 429 hàng loạt. |
| `COOKIE_SECURE=true` | 🔴 | ⬜ | Bắt buộc trên HTTPS để cookie refresh chỉ gửi qua TLS. |
| `MAIL_PROVIDER=resend` + `RESEND_API_KEY` | 🔴 | ✅ | Key thật đã có. |
| `EMAIL_FROM` | 🔴 | ✅ | `no-reply@toeicgreen.com` — domain phải được **verify trong Resend** (xem mục 4). |
| `EMAIL_VERIFICATION_URL` | 🔴 | ⬜ (đang localhost) | Đặt `https://toeicgreen.com/verify-email`. |
| `GOOGLE_CLIENT_ID` | 🔴 | ✅ | Khớp Client ID phía FE. |
| `GITHUB_*` | — | bỏ qua | Placeholder, GitHub OAuth chưa dùng — có thể xoá. |

## 2. Biến môi trường FRONTEND (build-time `NEXT_PUBLIC_*`)

| Biến | Trạng thái | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ⬜ | URL API prod, vd `https://api.toeicgreen.com/api`. |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | ⬜ | Origin R2 công khai (khớp `R2_PUBLIC_URL`). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | Cùng giá trị với BE `GOOGLE_CLIENT_ID`. |

> Lưu ý: `NEXT_PUBLIC_*` nhúng vào bundle lúc **build** → phải set TRƯỚC `next build`, đổi giá trị phải build lại.

## 3. Hạ tầng & domain

- ⬜ Deploy backend **cùng vùng Supabase** (`ap-northeast-1`) để giảm round-trip DB.
- ⬜ `prisma migrate deploy` trên DB prod (hiện schema đã up-to-date — 12/12 migration).
- ⬜ Frontend và API **cùng registrable domain** (vd `toeicgreen.com` ↔ `api.toeicgreen.com`) để cookie `sameSite:strict` hoạt động. Nếu khác domain hẳn → cookie refresh sẽ không gửi.
- ⬜ Nếu phục vụ cả `www` lẫn apex: hoặc redirect `www`→apex ở CDN, hoặc thêm vào `CORS_ALLOWED_ORIGINS`.

## 4. Dịch vụ ngoài

- ✅ Google OAuth: Authorized JS origins đã có `https://toeicgreen.com`, `https://www.toeicgreen.com`; app đã Publish (In production).
- ⬜ Resend: verify domain `toeicgreen.com` để gửi từ `no-reply@toeicgreen.com` (nếu chưa, email vào spam hoặc bị từ chối).
- ✅ Upstash Redis, Cloudflare R2: đã cấu hình.

## 5. Build & smoke trước khi mở cho người dùng

- ⬜ `npm --prefix back-end run build` → 0 issues.
- ⬜ `npm --prefix front-end run build` → thành công (đã set đủ `NEXT_PUBLIC_*`).
- ⬜ Khởi động prod, kiểm: đăng nhập mật khẩu + Google, refresh phiên, upload avatar, làm 1 đề + xem lại kết quả, bình luận.
- ⬜ Xác nhận response KHÔNG lộ stack trace; rate-limit hoạt động (đăng nhập sai nhiều lần → 429).

---

### Tóm tắt blocker còn lại (thuần vận hành, không phải code)
`NODE_ENV=production`, `FRONTEND_URL` thật, `EMAIL_VERIFICATION_URL` thật, `TRUST_PROXY=1`, `COOKIE_SECURE=true`, các `NEXT_PUBLIC_*` của FE, và verify domain Resend. Mọi thứ khác đã sẵn sàng.
