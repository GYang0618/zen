CREATE TABLE "agent_step_up_grants" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "tool_name" TEXT NOT NULL,
  "approval_id" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_step_up_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_step_up_grants_nonce_key" ON "agent_step_up_grants"("nonce");
CREATE INDEX "agent_step_up_grants_tenant_id_user_id_run_id_tool_name_expires_at_idx"
  ON "agent_step_up_grants"("tenant_id", "user_id", "run_id", "tool_name", "expires_at");
ALTER TABLE "agent_step_up_grants"
  ADD CONSTRAINT "agent_step_up_grants_approval_id_fkey"
  FOREIGN KEY ("approval_id") REFERENCES "agent_approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
