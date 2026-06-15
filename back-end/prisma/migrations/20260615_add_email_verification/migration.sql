ALTER TABLE "users"
ADD COLUMN "email_verified_at" TIMESTAMPTZ;

-- Existing password accounts predate verification and must remain usable.
UPDATE "users"
SET "email_verified_at" = "created_at"
WHERE "email_verified_at" IS NULL;

CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key"
ON "email_verification_tokens"("token_hash");

CREATE INDEX "email_verification_tokens_user_id_idx"
ON "email_verification_tokens"("user_id");

CREATE INDEX "email_verification_tokens_expires_at_idx"
ON "email_verification_tokens"("expires_at");

ALTER TABLE "email_verification_tokens"
ADD CONSTRAINT "email_verification_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
