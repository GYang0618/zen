CREATE TABLE "agent_threads" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL DEFAULT 'default_agent',
  "title" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "last_message_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_runs" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL DEFAULT 'default_agent',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "end_reason" TEXT,
  "budget" JSONB NOT NULL,
  "error" JSONB,
  "event_sequence" INTEGER NOT NULL DEFAULT 0,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_turns" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "end_reason" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_turns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_messages" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "turn_id" TEXT,
  "tenant_id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "tool_call_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_events" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_checkpoints" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "state" JSONB NOT NULL,
  "summary" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_approvals" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tool_call_id" TEXT NOT NULL,
  "interrupt_id" TEXT NOT NULL,
  "tool_name" TEXT NOT NULL,
  "arguments" JSONB NOT NULL,
  "arguments_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "decision" TEXT,
  "reason" TEXT,
  "decided_by" TEXT,
  "decided_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_tool_executions" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "tool_call_id" TEXT NOT NULL,
  "tool_name" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "arguments" JSONB,
  "result" JSONB,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "error_reason" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_tool_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_memories" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "sensitivity" TEXT NOT NULL DEFAULT 'private',
  "share_with_model" BOOLEAN NOT NULL DEFAULT false,
  "model_provider" TEXT,
  "approved_for_model_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_evaluations" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "evaluator" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_idempotency_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "request_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "response" JSONB,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_threads_tenant_id_user_id_updated_at_idx" ON "agent_threads"("tenant_id", "user_id", "updated_at");
CREATE INDEX "agent_threads_tenant_id_agent_id_status_idx" ON "agent_threads"("tenant_id", "agent_id", "status");
CREATE INDEX "agent_runs_tenant_id_user_id_created_at_idx" ON "agent_runs"("tenant_id", "user_id", "created_at");
CREATE INDEX "agent_runs_thread_id_created_at_idx" ON "agent_runs"("thread_id", "created_at");
CREATE INDEX "agent_runs_status_updated_at_idx" ON "agent_runs"("status", "updated_at");
CREATE UNIQUE INDEX "agent_turns_run_id_sequence_key" ON "agent_turns"("run_id", "sequence");
CREATE INDEX "agent_turns_tenant_id_created_at_idx" ON "agent_turns"("tenant_id", "created_at");
CREATE UNIQUE INDEX "agent_messages_thread_id_sequence_key" ON "agent_messages"("thread_id", "sequence");
CREATE INDEX "agent_messages_tenant_id_thread_id_created_at_idx" ON "agent_messages"("tenant_id", "thread_id", "created_at");
CREATE INDEX "agent_messages_tool_call_id_idx" ON "agent_messages"("tool_call_id");
CREATE UNIQUE INDEX "agent_events_run_id_sequence_key" ON "agent_events"("run_id", "sequence");
CREATE INDEX "agent_events_tenant_id_thread_id_sequence_idx" ON "agent_events"("tenant_id", "thread_id", "sequence");
CREATE INDEX "agent_events_run_id_type_idx" ON "agent_events"("run_id", "type");
CREATE UNIQUE INDEX "agent_checkpoints_thread_id_version_key" ON "agent_checkpoints"("thread_id", "version");
CREATE INDEX "agent_checkpoints_tenant_id_thread_id_created_at_idx" ON "agent_checkpoints"("tenant_id", "thread_id", "created_at");
CREATE UNIQUE INDEX "agent_approvals_run_id_tool_call_id_key" ON "agent_approvals"("run_id", "tool_call_id");
CREATE UNIQUE INDEX "agent_approvals_run_id_interrupt_id_key" ON "agent_approvals"("run_id", "interrupt_id");
CREATE INDEX "agent_approvals_tenant_id_user_id_status_created_at_idx" ON "agent_approvals"("tenant_id", "user_id", "status", "created_at");
CREATE UNIQUE INDEX "agent_tool_executions_tenant_id_idempotency_key_key" ON "agent_tool_executions"("tenant_id", "idempotency_key");
CREATE UNIQUE INDEX "agent_tool_executions_run_id_tool_call_id_key" ON "agent_tool_executions"("run_id", "tool_call_id");
CREATE INDEX "agent_tool_executions_tenant_id_tool_name_status_created_at_idx" ON "agent_tool_executions"("tenant_id", "tool_name", "status", "created_at");
CREATE UNIQUE INDEX "agent_memories_tenant_id_user_id_scope_key_key" ON "agent_memories"("tenant_id", "user_id", "scope", "key");
CREATE INDEX "agent_memories_tenant_id_user_id_expires_at_idx" ON "agent_memories"("tenant_id", "user_id", "expires_at");
CREATE UNIQUE INDEX "agent_evaluations_run_id_evaluator_metric_key" ON "agent_evaluations"("run_id", "evaluator", "metric");
CREATE INDEX "agent_evaluations_tenant_id_metric_created_at_idx" ON "agent_evaluations"("tenant_id", "metric", "created_at");
CREATE UNIQUE INDEX "agent_idempotency_records_tenant_id_user_id_key_key" ON "agent_idempotency_records"("tenant_id", "user_id", "key");
CREATE INDEX "agent_idempotency_records_expires_at_idx" ON "agent_idempotency_records"("expires_at");

ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_turns" ADD CONSTRAINT "agent_turns_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_turn_id_fkey" FOREIGN KEY ("turn_id") REFERENCES "agent_turns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_checkpoints" ADD CONSTRAINT "agent_checkpoints_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_approvals" ADD CONSTRAINT "agent_approvals_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tool_executions" ADD CONSTRAINT "agent_tool_executions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "agent_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_evaluations" ADD CONSTRAINT "agent_evaluations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
