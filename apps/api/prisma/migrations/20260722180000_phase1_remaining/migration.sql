-- Phase 1 remaining: mustChangePassword / password reset / login events

ALTER TABLE "user_security"
ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

DO $$ BEGIN
  ALTER TABLE "password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "login_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "identifier" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "login_events_user_id_created_at_idx" ON "login_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "login_events_created_at_idx" ON "login_events"("created_at");

DO $$ BEGIN
  ALTER TABLE "login_events"
    ADD CONSTRAINT "login_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
