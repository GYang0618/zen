-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('user', 'agent', 'system');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('success', 'failure', 'denied');

-- CreateEnum
CREATE TYPE "ApiCallerType" AS ENUM ('user', 'agent', 'api_key', 'anonymous');

-- CreateEnum
CREATE TYPE "AgentCallPurpose" AS ENUM ('chat', 'summarization', 'title', 'fallback');

-- CreateEnum
CREATE TYPE "AgentCallStatus" AS ENUM ('succeeded', 'failed', 'aborted');

-- CreateEnum
CREATE TYPE "AiQuotaScope" AS ENUM ('tenant', 'user', 'organization');

-- CreateEnum
CREATE TYPE "AiQuotaPeriod" AS ENUM ('day', 'month');

-- CreateEnum
CREATE TYPE "AiQuotaMetric" AS ENUM ('tokens', 'cost');

-- Extend AgentRun for usage accounting.
ALTER TABLE "agent_runs"
  ADD COLUMN "user_name" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "model" TEXT,
  ADD COLUMN "reasoning_tokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "cached_input_tokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "total_tokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "cost_micros" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "step_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "tool_call_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "write_tool_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "duration_ms" INTEGER,
  ADD COLUMN "usage_estimated" BOOLEAN NOT NULL DEFAULT false;

-- Extend operation and login audit records.
DROP INDEX "audit_logs_tenant_id_created_at_idx";
DROP INDEX "audit_logs_actor_id_idx";
DROP INDEX "audit_logs_action_idx";

ALTER TABLE "audit_logs"
  ADD COLUMN "actor_type" "AuditActorType" NOT NULL DEFAULT 'user',
  ADD COLUMN "actor_name" TEXT,
  ADD COLUMN "resource_name" TEXT,
  ADD COLUMN "result" "AuditResult" NOT NULL DEFAULT 'success',
  ADD COLUMN "error_code" TEXT,
  ADD COLUMN "endpoint" TEXT,
  ADD COLUMN "agent_run_id" TEXT,
  ADD COLUMN "agent_tool_name" TEXT,
  ADD COLUMN "agent_approval_id" TEXT;

ALTER TABLE "login_events"
  ADD COLUMN "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
  ADD COLUMN "trace_id" TEXT,
  ADD COLUMN "event" TEXT NOT NULL DEFAULT 'login';

-- API request access log and minute aggregates.
CREATE TABLE "api_access_logs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "user_id" TEXT,
  "caller_type" "ApiCallerType" NOT NULL DEFAULT 'user',
  "api_key_id" TEXT,
  "agent_run_id" TEXT,
  "agent_tool_name" TEXT,
  "method" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" INTEGER NOT NULL,
  "latency_ms" INTEGER NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "trace_id" TEXT NOT NULL,
  "sampled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_access_stats" (
  "tenant_id" TEXT NOT NULL,
  "bucket" TIMESTAMP(3) NOT NULL,
  "method" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "caller_type" "ApiCallerType" NOT NULL,
  "count" INTEGER NOT NULL,
  "error_count" INTEGER NOT NULL,
  "p95_ms" INTEGER NOT NULL,
  CONSTRAINT "api_access_stats_pkey" PRIMARY KEY ("tenant_id", "bucket", "method", "route", "caller_type")
);

-- Agent token ledger, model pricing snapshots and daily aggregates.
CREATE TABLE "agent_model_calls" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "run_id" TEXT,
  "thread_id" TEXT,
  "call_index" INTEGER NOT NULL DEFAULT 0,
  "purpose" "AgentCallPurpose" NOT NULL DEFAULT 'chat',
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "status" "AgentCallStatus" NOT NULL DEFAULT 'succeeded',
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "reasoning_tokens" INTEGER NOT NULL DEFAULT 0,
  "cached_input_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "estimated" BOOLEAN NOT NULL DEFAULT false,
  "price_id" TEXT,
  "price_snapshot" JSONB,
  "cost_micros" BIGINT NOT NULL DEFAULT 0,
  "latency_ms" INTEGER,
  "first_token_ms" INTEGER,
  "error_code" TEXT,
  "trace_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_model_calls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_model_prices" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CNY',
  "input_per_mtok" BIGINT NOT NULL,
  "cached_input_per_mtok" BIGINT,
  "output_per_mtok" BIGINT NOT NULL,
  "reasoning_per_mtok" BIGINT,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_model_prices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_usage_daily" (
  "tenant_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "user_id" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "purpose" "AgentCallPurpose" NOT NULL,
  "runs" INTEGER NOT NULL DEFAULT 0,
  "model_calls" INTEGER NOT NULL DEFAULT 0,
  "tool_calls" INTEGER NOT NULL DEFAULT 0,
  "input_tokens" BIGINT NOT NULL DEFAULT 0,
  "output_tokens" BIGINT NOT NULL DEFAULT 0,
  "reasoning_tokens" BIGINT NOT NULL DEFAULT 0,
  "cached_input_tokens" BIGINT NOT NULL DEFAULT 0,
  "total_tokens" BIGINT NOT NULL DEFAULT 0,
  "cost_micros" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "agent_usage_daily_pkey" PRIMARY KEY ("tenant_id", "date", "user_id", "model", "purpose")
);

CREATE TABLE "ai_quotas" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "scope" "AiQuotaScope" NOT NULL,
  "subject_id" TEXT,
  "period" "AiQuotaPeriod" NOT NULL,
  "metric" "AiQuotaMetric" NOT NULL,
  "soft_limit" BIGINT,
  "hard_limit" BIGINT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_quotas_pkey" PRIMARY KEY ("id")
);

-- Indexes.
CREATE INDEX "agent_runs_tenant_id_created_at_idx" ON "agent_runs"("tenant_id", "created_at" DESC);
CREATE INDEX "agent_runs_tenant_id_model_created_at_idx" ON "agent_runs"("tenant_id", "model", "created_at");
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at" DESC);
CREATE INDEX "audit_logs_tenant_id_resource_resource_id_created_at_idx" ON "audit_logs"("tenant_id", "resource", "resource_id", "created_at");
CREATE INDEX "audit_logs_tenant_id_actor_id_created_at_idx" ON "audit_logs"("tenant_id", "actor_id", "created_at");
CREATE INDEX "audit_logs_tenant_id_action_created_at_idx" ON "audit_logs"("tenant_id", "action", "created_at");
CREATE INDEX "audit_logs_agent_run_id_idx" ON "audit_logs"("agent_run_id");
CREATE INDEX "login_events_tenant_id_created_at_idx" ON "login_events"("tenant_id", "created_at");
CREATE INDEX "login_events_trace_id_idx" ON "login_events"("trace_id");
CREATE INDEX "api_access_logs_tenant_id_created_at_idx" ON "api_access_logs"("tenant_id", "created_at" DESC);
CREATE INDEX "api_access_logs_tenant_id_user_id_created_at_idx" ON "api_access_logs"("tenant_id", "user_id", "created_at");
CREATE INDEX "api_access_logs_tenant_id_route_created_at_idx" ON "api_access_logs"("tenant_id", "route", "created_at");
CREATE INDEX "api_access_logs_agent_run_id_idx" ON "api_access_logs"("agent_run_id");
CREATE INDEX "api_access_logs_trace_id_idx" ON "api_access_logs"("trace_id");
CREATE INDEX "agent_model_calls_tenant_id_created_at_idx" ON "agent_model_calls"("tenant_id", "created_at");
CREATE INDEX "agent_model_calls_tenant_id_user_id_created_at_idx" ON "agent_model_calls"("tenant_id", "user_id", "created_at");
CREATE INDEX "agent_model_calls_tenant_id_model_created_at_idx" ON "agent_model_calls"("tenant_id", "model", "created_at");
CREATE UNIQUE INDEX "agent_model_calls_run_id_call_index_key" ON "agent_model_calls"("run_id", "call_index");
CREATE INDEX "ai_model_prices_provider_model_effective_from_idx" ON "ai_model_prices"("provider", "model", "effective_from");
CREATE INDEX "agent_usage_daily_tenant_id_date_idx" ON "agent_usage_daily"("tenant_id", "date");
CREATE UNIQUE INDEX "ai_quotas_tenant_id_scope_subject_id_period_metric_key" ON "ai_quotas"("tenant_id", "scope", "subject_id", "period", "metric");

-- Agent model calls belong to their run when a run id is available.
ALTER TABLE "agent_model_calls"
  ADD CONSTRAINT "agent_model_calls_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
