-- AlterTable
ALTER TABLE "agent_checkpoints" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;
ALTER TABLE "agent_checkpoints" ADD COLUMN IF NOT EXISTS "namespace" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "agent_checkpoints" ADD COLUMN IF NOT EXISTS "state_hash" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "agent_checkpoints_parent_id_idx" ON "agent_checkpoints"("parent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_checkpoints_parent_id_fkey'
  ) THEN
    ALTER TABLE "agent_checkpoints"
      ADD CONSTRAINT "agent_checkpoints_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "agent_checkpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_threads_tenant_id_fkey'
  ) THEN
    ALTER TABLE "agent_threads"
      ADD CONSTRAINT "agent_threads_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_threads_user_id_fkey'
  ) THEN
    ALTER TABLE "agent_threads"
      ADD CONSTRAINT "agent_threads_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
