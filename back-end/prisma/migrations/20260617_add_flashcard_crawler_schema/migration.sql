-- Extend Explore vocabulary tables so crawled flashcard data can live in
-- Supabase while media is served from R2.

ALTER TABLE "explore_collections"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'study4',
ADD COLUMN "source_list_id" TEXT,
ADD COLUMN "author" TEXT,
ADD COLUMN "source_url" TEXT,
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "expected_word_count" INTEGER,
ADD COLUMN "estimated_minutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "total_pages" INTEGER,
ADD COLUMN "cover_image_url" TEXT,
ADD COLUMN "cover_image_key" TEXT,
ADD COLUMN "crawled_at" TIMESTAMPTZ,
ADD COLUMN "imported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "explore_words"
ADD COLUMN "source_index" INTEGER,
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sublist" TEXT,
ADD COLUMN "normalized_word" TEXT NOT NULL DEFAULT '',
ADD COLUMN "source_image_path" TEXT,
ADD COLUMN "image_key" TEXT,
ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "explore_words"
SET "normalized_word" = lower(btrim("word"))
WHERE "normalized_word" = '';

CREATE TABLE "explore_word_examples" (
    "id" BIGSERIAL NOT NULL,
    "explore_word_id" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "translation" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "explore_word_examples_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "explore_collections_source_source_list_id_key"
ON "explore_collections"("source", "source_list_id");

CREATE INDEX "explore_collections_is_published_sort_order_idx"
ON "explore_collections"("is_published", "sort_order");

CREATE INDEX "explore_collections_category_idx"
ON "explore_collections"("category");

CREATE UNIQUE INDEX "explore_words_collection_id_source_index_key"
ON "explore_words"("collection_id", "source_index");

CREATE INDEX "explore_words_collection_id_sort_order_idx"
ON "explore_words"("collection_id", "sort_order");

CREATE INDEX "explore_words_collection_id_normalized_word_idx"
ON "explore_words"("collection_id", "normalized_word");

CREATE INDEX "explore_words_normalized_word_idx"
ON "explore_words"("normalized_word");

CREATE UNIQUE INDEX "explore_word_examples_explore_word_id_sort_order_key"
ON "explore_word_examples"("explore_word_id", "sort_order");

CREATE INDEX "explore_word_examples_explore_word_id_idx"
ON "explore_word_examples"("explore_word_id");

ALTER TABLE "explore_word_examples"
ADD CONSTRAINT "explore_word_examples_explore_word_id_fkey"
FOREIGN KEY ("explore_word_id") REFERENCES "explore_words"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
