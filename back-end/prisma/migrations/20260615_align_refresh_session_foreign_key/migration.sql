ALTER TABLE "refresh_sessions"
DROP CONSTRAINT "refresh_sessions_user_id_fkey";

ALTER TABLE "refresh_sessions"
ADD CONSTRAINT "refresh_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
