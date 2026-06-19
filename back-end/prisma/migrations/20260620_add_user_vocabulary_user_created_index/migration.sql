-- Index cho liệt kê sổ từ vựng theo user, sắp xếp mới nhất trước.
-- Tránh sort khi user có nhiều từ; scale theo số người dùng.
CREATE INDEX IF NOT EXISTS "user_vocabularies_user_id_created_at_idx"
  ON "user_vocabularies" ("user_id", "created_at");
