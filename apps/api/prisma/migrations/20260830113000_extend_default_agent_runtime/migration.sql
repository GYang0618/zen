ALTER TABLE "agent_runs"
  ADD COLUMN "model_calls" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failure_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "trace_id" TEXT,
  ADD COLUMN "model_version" TEXT,
  ADD COLUMN "prompt_version" TEXT,
  ADD COLUMN "tool_schema_version" TEXT,
  ADD COLUMN "first_token_at" TIMESTAMP(3),
  ADD COLUMN "last_heartbeat_at" TIMESTAMP(3),
  ADD COLUMN "lease_owner" TEXT,
  ADD COLUMN "lease_expires_at" TIMESTAMP(3),
  ADD COLUMN "resume_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "agent_approvals"
  ADD COLUMN "operation" TEXT,
  ADD COLUMN "target_summary" TEXT,
  ADD COLUMN "impact_summary" TEXT,
  ADD COLUMN "risk_level" TEXT,
  ADD COLUMN "parameter_summary" TEXT;

ALTER TABLE "agent_tool_executions"
  ADD COLUMN "permission_code" TEXT,
  ADD COLUMN "risk_level" TEXT,
  ADD COLUMN "side_effect" TEXT,
  ADD COLUMN "trace_id" TEXT;

CREATE TABLE "agent_artifacts" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tool_execution_id" TEXT,
  "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL DEFAULT 'application/json',
  "size" INTEGER NOT NULL,
  "summary" TEXT,
  "content" JSONB,
  "storage_key" TEXT,
  "status" TEXT NOT NULL DEFAULT 'available',
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_runs_lease_expires_at_idx" ON "agent_runs"("lease_expires_at");
CREATE INDEX "agent_artifacts_tenant_id_user_id_created_at_idx" ON "agent_artifacts"("tenant_id", "user_id", "created_at");
CREATE INDEX "agent_artifacts_run_id_created_at_idx" ON "agent_artifacts"("run_id", "created_at");
CREATE INDEX "agent_artifacts_thread_id_created_at_idx" ON "agent_artifacts"("thread_id", "created_at");

ALTER TABLE "agent_artifacts"
  ADD CONSTRAINT "agent_artifacts_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_artifacts"
  ADD CONSTRAINT "agent_artifacts_tool_execution_id_fkey"
  FOREIGN KEY ("tool_execution_id") REFERENCES "agent_tool_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
