-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "banner_tone" TEXT NOT NULL DEFAULT 'mint',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "type" TEXT NOT NULL,
    "short_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 120,
    "total_questions" INTEGER NOT NULL DEFAULT 200,
    "access_level" TEXT NOT NULL DEFAULT 'FREE',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_parts" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "question_count" INTEGER NOT NULL,

    CONSTRAINT "test_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_groups" (
    "id" BIGSERIAL NOT NULL,
    "test_part_id" INTEGER NOT NULL,
    "passage" TEXT,
    "audio_url" TEXT,
    "image_url" TEXT,
    "transcript" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" BIGSERIAL NOT NULL,
    "test_part_id" INTEGER NOT NULL,
    "group_id" BIGINT,
    "question_number" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT,
    "correct_answer" CHAR(1) NOT NULL,
    "explanation" TEXT,
    "image_url" TEXT,
    "audio_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_attempts" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "test_id" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "scaled_score" INTEGER,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "practice_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "attempt_id" BIGINT NOT NULL,
    "question_id" BIGINT NOT NULL,
    "selected_answer" CHAR(1),
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "time_spent_ms" INTEGER NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("attempt_id","question_id")
);

-- CreateTable
CREATE TABLE "user_vocabularies" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "part_of_speech" TEXT,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "example_translation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEARNING',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "audio_url" TEXT,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explore_collections" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "level" TEXT,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "explore_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explore_words" (
    "id" BIGSERIAL NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "part_of_speech" TEXT,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "example_translation" TEXT,
    "image_url" TEXT,
    "audio_url" TEXT,

    CONSTRAINT "explore_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explore_progress" (
    "user_id" UUID NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "is_studying" BOOLEAN NOT NULL DEFAULT false,
    "last_studied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "explore_progress_pkey" PRIMARY KEY ("user_id","collection_id")
);

-- CreateTable
CREATE TABLE "word_ratings" (
    "user_id" UUID NOT NULL,
    "explore_word_id" BIGINT NOT NULL,
    "rating" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_ratings_pkey" PRIMARY KEY ("user_id","explore_word_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

ALTER TABLE "users"
ADD CONSTRAINT "users_email_canonical_check"
CHECK ("email" = lower(btrim("email")));

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_idx" ON "refresh_sessions"("user_id");

-- CreateIndex
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_user_id_key" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tests_slug_key" ON "tests"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "test_parts_test_id_part_number_key" ON "test_parts"("test_id", "part_number");

-- CreateIndex
CREATE UNIQUE INDEX "questions_test_part_id_question_number_key" ON "questions"("test_part_id", "question_number");

-- CreateIndex
CREATE UNIQUE INDEX "practice_attempts_public_id_key" ON "practice_attempts"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabularies_user_id_word_key" ON "user_vocabularies"("user_id", "word");

-- CreateIndex
CREATE UNIQUE INDEX "explore_collections_slug_key" ON "explore_collections"("slug");

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_parts" ADD CONSTRAINT "test_parts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_groups" ADD CONSTRAINT "question_groups_test_part_id_fkey" FOREIGN KEY ("test_part_id") REFERENCES "test_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_part_id_fkey" FOREIGN KEY ("test_part_id") REFERENCES "test_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "question_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "practice_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabularies" ADD CONSTRAINT "user_vocabularies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explore_words" ADD CONSTRAINT "explore_words_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "explore_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explore_progress" ADD CONSTRAINT "explore_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explore_progress" ADD CONSTRAINT "explore_progress_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "explore_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_ratings" ADD CONSTRAINT "word_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_ratings" ADD CONSTRAINT "word_ratings_explore_word_id_fkey" FOREIGN KEY ("explore_word_id") REFERENCES "explore_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

