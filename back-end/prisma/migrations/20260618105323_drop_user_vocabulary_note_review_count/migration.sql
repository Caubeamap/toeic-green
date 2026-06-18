-- Bỏ 2 trường không dùng khỏi sổ từ vựng cá nhân.
ALTER TABLE "user_vocabularies" DROP COLUMN IF EXISTS "note";
ALTER TABLE "user_vocabularies" DROP COLUMN IF EXISTS "review_count";
