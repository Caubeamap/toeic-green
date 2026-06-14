# Kế hoạch Hoàn thiện Backend TOEIC Green (Backend TODO List)

Tài liệu này là danh sách công việc (checklists) chi tiết để phát triển và hoàn thiện hệ thống Backend của **TOEIC Green**. Các đầu việc được phân rã theo phân hệ độc lập, hỗ trợ theo dõi tiến độ dễ dàng.

---

## 📋 TIẾN ĐỘ TỔNG QUAN

- [x] **Phase 1: Foundation (Thiết lập Nền móng)** - *Hoàn thành 80% (Còn phần JWT Guards & Redis)*
- [ ] **Phase 2: Core Content (Dữ liệu thi & Chấm điểm)** - *Chưa bắt đầu*
- [ ] **Phase 3: User Space & Data Sync (Từ vựng & Tiến trình)** - *Chưa bắt đầu*
- [ ] **Phase 4: Production Ready (Vận hành & Deploy)** - *Chưa bắt đầu*

---

## 🛠️ CHI TIẾT CÁC ĐẦU VIỆC (CHECKLISTS)

### Phân hệ 1: Cơ sở hạ tầng dùng chung (Common Infrastructure)
- [x] Tạo `PrismaService` kết nối Supabase dùng cơ chế PG Pool.
- [x] Cấu hình `@nestjs/config` và nạp các tệp config bảo mật (`src/config/`).
- [x] Tạo Decorator `@Public()` và `@CurrentUser()`.
- [x] Thiết lập `PrismaClientExceptionFilter` để bắt lỗi DB.
- [ ] **Tạo RedisModule**:
  - [ ] Khởi tạo Redis Client kết nối local/Upstash.
  - [ ] Viết `RedisService` cung cấp các hàm helper: `get`, `set`, `del`, `setWithTtl`.
- [ ] **Cơ chế Bảo mật Định tuyến (Global Auth Guard)**:
  - [ ] Viết `JwtAuthGuard` toàn cục để mặc định bảo vệ mọi API route.
  - [ ] Sử dụng decorator `@Public()` để mở khóa các API công khai (như xem đề thi).

---

### Phân hệ 2: Xác thực & Hồ sơ Cá nhân (Auth & Profile)
- [ ] **Auth Module**:
  - [ ] Tạo DTOs đầu vào: `RegisterDto`, `LoginDto` (validate bằng `class-validator`).
  - [ ] Lập trình hàm `register`:
    - [ ] Mã hóa mật khẩu bằng **bcrypt** (salt rounds = 12).
    - [ ] Tự động tạo bản ghi trống trong bảng `user_profiles` cho user mới.
  - [ ] Lập trình hàm `login`:
    - [ ] Kiểm tra mật khẩu hash.
    - [ ] Phát hành Access Token (JWT - thời hạn 15m).
    - [ ] Phát hành Refresh Token (JWT - thời hạn 7d).
    - [ ] Lưu Refresh Token (đã hash) vào bảng `refresh_tokens`.
    - [ ] Thiết lập cookie `refresh_token` dạng **HttpOnly, Secure, SameSite=Strict**.
  - [ ] Lập trình API `POST /auth/refresh`:
    - [ ] Kiểm tra Refresh Token trong cookie.
    - [ ] Rotate Refresh Token (hủy token cũ, phát hành cặp Access/Refresh mới).
  - [ ] Lập trình API `POST /auth/logout`:
    - [ ] Xóa Refresh Token khỏi cơ sở dữ liệu và cookie.
- [ ] **Google & GitHub OAuth**:
  - [ ] Cài đặt passport strategies tương ứng.
  - [ ] Lập trình callback route để tạo/liên kết tài khoản và phát token.
- [ ] **Profile Module**:
  - [ ] `GET /api/profile` - Lấy thông tin cá nhân của user đang đăng nhập.
  - [ ] `PATCH /api/profile` - Cập nhật `target_score`, `banner_tone`, `study_hours_per_week`, `bio`.

---

### Phân hệ 3: Dữ liệu Đề thi & Nhập liệu tự động (Tests & Seed Pipeline)
- [ ] **Seed Script (prisma/seed.ts)**:
  - [ ] Viết script phân tích cấu trúc JSON thô của 10 đề thi đã crawl trong `toeic-crawler/output/`.
  - [ ] Import đề thi theo thứ tự: `tests` $\rightarrow$ `test_parts` $\rightarrow$ `question_groups` (nếu có audio/passage chung) $\rightarrow$ `questions`.
  - [ ] Upload các file audio MP3 và ảnh câu hỏi lên **Cloudflare R2** và cập nhật link CDN vào database.
- [ ] **Tests API**:
  - [ ] `GET /api/tests` - Danh sách đề thi (phân trang, lọc theo thể loại L&R hoặc S&W).
  - [ ] `GET /api/tests/:slug` - Chi tiết đề thi gồm cấu trúc các Part và số câu hỏi.
  - [ ] `GET /api/tests/:slug/questions` - Lấy toàn bộ 200 câu hỏi thi.
    - *Yêu cầu bảo mật*: **Không trả về đáp án đúng (`correct_answer`) và lời giải thích (`explanation`)** để tránh học viên ấn F12 xem đáp án trước.

---

### Phân hệ 4: Làm bài & Chấm điểm tự động (Practice & Grading Engine)
- [ ] **API Quản lý Lượt thi (Attempts)**:
  - [ ] `POST /api/practice/attempts` - Khởi tạo lượt làm bài mới (chọn chế độ Luyện tập từng Part hoặc Thi Full đề). Trả về ID lượt làm và danh sách câu hỏi.
  - [ ] `GET /api/practice/attempts` - Lấy lịch sử làm bài thi của user hiện tại.
  - [ ] `GET /api/practice/attempts/:id` - Xem chi tiết một bài thi đã hoàn thành (bao gồm đáp án đã chọn, đáp án đúng, giải thích chi tiết của 200 câu).
- [ ] **Công cụ Chấm điểm (Grading Engine)**:
  - [ ] `POST /api/practice/attempts/:id/submit` - Người dùng nộp bài thi.
  - [ ] Lưu các câu trả lời thô vào bảng `attempt_answers` (sử dụng Upsert).
  - [ ] So sánh đáp án với bảng `questions` để tính số câu đúng/sai.
  - [ ] Thực hiện quy đổi điểm thi TOEIC (từ thang số câu đúng ra thang điểm 10-990).
  - [ ] Cập nhật trạng thái `practice_attempts` thành `COMPLETED` và lưu điểm số.
  - *Tối ưu hóa tải lớn*: Sử dụng **BullMQ** để chạy tác vụ tính toán điểm nền bất đồng bộ nếu nộp bài thi Full 200 câu.

---

### Phân hệ 5: Sổ tay Từ vựng & Khám phá (Vocabulary & Explore)
- [ ] **Sổ tay từ vựng của User**:
  - [ ] `GET /api/vocabulary` - Danh sách từ vựng cá nhân đã lưu (phân trang, tìm kiếm, lọc theo tag, lọc trạng thái LEARNING/MASTERED).
  - [ ] `POST /api/vocabulary` - Thêm từ vựng mới.
  - [ ] `PATCH /api/vocabulary/:id` - Cập nhật từ vựng (đổi trạng thái, thêm ghi chú, yêu thích).
  - [ ] `DELETE /api/vocabulary/:id` - Xóa từ vựng khỏi sổ tay.
  - [ ] `GET /api/vocabulary/lookup/:word` - Gọi API từ điển bên ngoài làm proxy tra cứu nghĩa của từ nhanh.
- [ ] **Bộ từ vựng Khám phá (Explore Collections)**:
  - [ ] `GET /api/explore/collections` - Lấy danh sách bộ từ vựng hệ thống (như 600 từ TOEIC).
  - [ ] `GET /api/explore/collections/:slug` - Chi tiết danh sách từ trong bộ từ vựng.
  - [ ] `POST /api/explore/progress/rate` - Đánh giá từ vựng theo Flashcard (EASY, MEDIUM, HARD, KNOWN) để tính toán thuật toán lặp lại ngắt quãng (Spaced Repetition) trong tương lai.

---

### Phân hệ 6: Biểu đồ & Phân tích Tiến độ (Analytics & Dashboard)
- [ ] `GET /api/progress/overview` - Lấy tổng quan chỉ số: Streak ngày học, số bài thi đã làm, số từ vựng đã thuộc.
- [ ] `GET /api/progress/parts` - Phân tích điểm mạnh/điểm yếu theo từng Part từ 1 đến 7 (ví dụ: Part 5 đúng 80%, Part 7 đúng 40% để gợi ý lộ trình học).
- [ ] `GET /api/progress/chart` - Dữ liệu vẽ biểu đồ tiến độ điểm số qua các lượt thi gần nhất.

---

### Phân hệ 7: Vận hành & Cấu hình Production (Production Ready)
- [ ] **Rate Limiting (Chống Spam API)**:
  - [ ] Cấu hình `nestjs-throttler` dùng bộ đếm Redis. Giới hạn tần suất gọi API.
- [ ] **Swagger Documentation**:
  - [ ] Cấu hình `@nestjs/swagger` trong `main.ts`.
  - [ ] Viết các decorator `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` cho toàn bộ controllers để sinh tài liệu API tự động tại `/api/docs`.
- [ ] **Logging (Ghi nhật ký hệ thống)**:
  - [ ] Viết global `LoggingInterceptor` để ghi lại thời gian xử lý và mã lỗi của mỗi request.
- [ ] **CI/CD Pipeline**:
  - [ ] Tạo workflow GitHub Actions để chạy test, build ảnh Docker tự động và đẩy lên Container Registry (Docker Hub / Github Package).
