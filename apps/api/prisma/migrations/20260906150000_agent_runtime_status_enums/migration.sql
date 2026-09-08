CREATE TYPE "AgentThreadStatus" AS ENUM ('active', 'archived');
CREATE TYPE "AgentRunStatus" AS ENUM (
  'pending',
  'running',
  'finishing',
  'succeeded',
  'failed',
  'cancelled',
  'timed_out',
  'interrupted'
);
CREATE TYPE "AgentEndReason" AS ENUM (
  'completed',
  'interrupted',
  'cancelled',
  'disconnected',
  'timeout',
  'budget_exceeded',
  'model_error',
  'approval_rejected',
  'approval_expired'
);
CREATE TYPE "AgentToolExecutionStatus" AS ENUM (
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled'
);
CREATE TYPE "AgentApprovalStatus" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired',
  'cancelled'
);
CREATE TYPE "AgentApprovalDecision" AS ENUM ('approve', 'reject');
CREATE TYPE "AgentRiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "AgentSideEffect" AS ENUM ('read_only', 'write');
CREATE TYPE "AgentArtifactStatus" AS ENUM ('available', 'expired', 'deleted');
CREATE TYPE "AgentMemorySensitivity" AS ENUM ('private', 'non_sensitive');
CREATE TYPE "AgentIdempotencyStatus" AS ENUM ('running', 'succeeded', 'failed');

ALTER TABLE "agent_threads"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentThreadStatus" USING "status"::text::"AgentThreadStatus",
  ALTER COLUMN "status" SET DEFAULT 'active';

ALTER TABLE "agent_runs"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentRunStatus" USING "status"::text::"AgentRunStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending',
  ALTER COLUMN "end_reason" TYPE "AgentEndReason" USING "end_reason"::text::"AgentEndReason";

ALTER TABLE "agent_turns"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentRunStatus" USING "status"::text::"AgentRunStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending',
  ALTER COLUMN "end_reason" TYPE "AgentEndReason" USING "end_reason"::text::"AgentEndReason";

ALTER TABLE "agent_approvals"
  ALTER COLUMN "risk_level" TYPE "AgentRiskLevel" USING "risk_level"::text::"AgentRiskLevel",
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentApprovalStatus" USING "status"::text::"AgentApprovalStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending',
  ALTER COLUMN "decision" TYPE "AgentApprovalDecision" USING "decision"::text::"AgentApprovalDecision";

ALTER TABLE "agent_tool_executions"
  ALTER COLUMN "risk_level" TYPE "AgentRiskLevel" USING "risk_level"::text::"AgentRiskLevel",
  ALTER COLUMN "side_effect" TYPE "AgentSideEffect" USING "side_effect"::text::"AgentSideEffect",
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentToolExecutionStatus" USING "status"::text::"AgentToolExecutionStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "agent_artifacts"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentArtifactStatus" USING "status"::text::"AgentArtifactStatus",
  ALTER COLUMN "status" SET DEFAULT 'available';

ALTER TABLE "agent_memories"
  ALTER COLUMN "sensitivity" DROP DEFAULT,
  ALTER COLUMN "sensitivity" TYPE "AgentMemorySensitivity" USING "sensitivity"::text::"AgentMemorySensitivity",
  ALTER COLUMN "sensitivity" SET DEFAULT 'private';

ALTER TABLE "agent_idempotency_records"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AgentIdempotencyStatus" USING "status"::text::"AgentIdempotencyStatus",
  ALTER COLUMN "status" SET DEFAULT 'running';
