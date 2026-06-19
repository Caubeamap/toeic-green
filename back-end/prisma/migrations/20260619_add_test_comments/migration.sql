CREATE TABLE "test_comments" (
    "id" BIGSERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" BIGINT,
    "root_id" BIGINT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "test_comments_test_id_parent_id_created_at_id_idx"
    ON "test_comments" ("test_id", "parent_id", "created_at" DESC, "id" DESC);
CREATE INDEX "test_comments_root_id_created_at_idx"
    ON "test_comments" ("root_id", "created_at");

ALTER TABLE "test_comments" ADD CONSTRAINT "test_comments_test_id_fkey"
    FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "test_comments" ADD CONSTRAINT "test_comments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "test_comments" ADD CONSTRAINT "test_comments_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "test_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
