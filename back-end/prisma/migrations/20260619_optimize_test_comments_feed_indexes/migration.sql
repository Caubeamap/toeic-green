CREATE INDEX CONCURRENTLY IF NOT EXISTS "test_comments_active_unpinned_roots_idx"
    ON "test_comments" ("test_id", "created_at" DESC, "id" DESC)
    WHERE "parent_id" IS NULL
      AND "deleted_at" IS NULL
      AND "is_pinned" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "test_comments_active_pinned_roots_idx"
    ON "test_comments" ("test_id", "created_at" DESC, "id" DESC)
    WHERE "parent_id" IS NULL
      AND "deleted_at" IS NULL
      AND "is_pinned" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "test_comments_active_descendants_idx"
    ON "test_comments" ("root_id", "created_at", "id")
    WHERE "deleted_at" IS NULL
      AND "root_id" IS NOT NULL;
