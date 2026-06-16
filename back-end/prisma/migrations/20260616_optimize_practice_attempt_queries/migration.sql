CREATE INDEX IF NOT EXISTS "practice_attempts_status_test_id_idx"
  ON "practice_attempts"("status", "test_id");

CREATE INDEX IF NOT EXISTS "practice_attempts_user_id_status_completed_at_idx"
  ON "practice_attempts"("user_id", "status", "completed_at");

CREATE INDEX IF NOT EXISTS "practice_attempts_user_id_test_id_status_completed_at_idx"
  ON "practice_attempts"("user_id", "test_id", "status", "completed_at");
