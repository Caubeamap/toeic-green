CREATE TABLE "pending_registrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pending_registrations_email_key" ON "pending_registrations"("email");
CREATE UNIQUE INDEX "pending_registrations_token_hash_key" ON "pending_registrations"("token_hash");
CREATE INDEX "pending_registrations_expires_at_idx" ON "pending_registrations"("expires_at");
