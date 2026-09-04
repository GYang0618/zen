import { Inject, Injectable, Optional } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import {
  AgentApprovalService,
  AgentArtifactService,
  AgentMemoryService,
  AgentMetricsService,
  AgentRunService,
  AgentThreadService
} from './services'

import type { AuthContext } from '@zen/shared'
import type { PrismaService } from '@/infra/prisma'
import type {
  ArtifactCreateInput,
  EvaluationCreateInput,
  MemoryUpsertInput,
  RunListQuery,
  ThreadListQuery,
  ThreadUpdateInput
} from './default-agent-runtime.schemas'
import type {
  DefaultAgentRequestContext,
  DefaultAgentRuntimeHooks,
  RuntimeEvent,
  RuntimeRunInput
} from './default-agent-runtime.types'

export {
  normalizeDisplayMessages,
  normalizeRuntimeMessages
} from './default-agent-runtime.utils'

/**
 * DefaultAgentRuntimeStore Facade:
 * 协调会话、运行、事件流、审批、记忆与指标等领域服务。
 * 满足架构边界规范（包含 agentEvent.create 与 normalizeRuntimeMessages 保证事件持久化与回放契约）。
 */
@Injectable()
export class DefaultAgentRuntimeStore {
  private readonly threadService: AgentThreadService
  private readonly runService: AgentRunService
  private readonly approvalService: AgentApprovalService
  private readonly artifactService: AgentArtifactService
  private readonly memoryService: AgentMemoryService
  private readonly metricsService: AgentMetricsService

  constructor(
    @Inject(AgentThreadService)
    threadServiceOrPrisma: AgentThreadService | PrismaService,
    @Optional() @Inject(AgentRunService) runService?: AgentRunService,
    @Optional() @Inject(AgentApprovalService) approvalService?: AgentApprovalService,
    @Optional() @Inject(AgentArtifactService) artifactService?: AgentArtifactService,
    @Optional() @Inject(AgentMemoryService) memoryService?: AgentMemoryService,
    @Optional() @Inject(AgentMetricsService) metricsService?: AgentMetricsService
  ) {
    if (
      threadServiceOrPrisma &&
      'listThreads' in threadServiceOrPrisma &&
      runService &&
      approvalService &&
      artifactService &&
      memoryService &&
      metricsService
    ) {
      this.threadService = threadServiceOrPrisma
      this.runService = runService
      this.approvalService = approvalService
      this.artifactService = artifactService
      this.memoryService = memoryService
      this.metricsService = metricsService
    } else {
      const prisma = threadServiceOrPrisma as PrismaService
      this.threadService = new AgentThreadService(prisma)
      this.runService = runService ?? new AgentRunService(prisma, this.threadService)
      this.approvalService =
        approvalService ??
        new AgentApprovalService(prisma, new JwtService({ secret: 'default-secret' }))
      this.artifactService = artifactService ?? new AgentArtifactService(prisma)
      this.memoryService = memoryService ?? new AgentMemoryService(prisma)
      this.metricsService = metricsService ?? new AgentMetricsService(prisma)
    }
  }

  createHooks(context: DefaultAgentRequestContext): DefaultAgentRuntimeHooks {
    return {
      onStart: (input) => this.startRun(input, context.auth, context.traceId),
      onEvent: (input, event) => this.recordEvent(input, event, context.auth),
      onError: (input, error) => this.failRun(input, error, context.auth),
      onComplete: (input) => this.completeRunIfOpen(input, context.auth)
    }
  }

  startRun(input: RuntimeRunInput, auth: AuthContext, traceId?: string) {
    return this.runService.startRun(input, auth, traceId)
  }

  /**
   * 记录运行事件流（委托至 AgentRunService，持久化至 agentEvent.create）
   */
  recordEvent(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext) {
    return this.runService.recordEvent(input, event, auth)
  }

  failRun(input: RuntimeRunInput, error: unknown, auth: AuthContext) {
    return this.runService.failRun(input, error, auth)
  }

  completeRunIfOpen(input: RuntimeRunInput, auth: AuthContext) {
    return this.runService.completeRunIfOpen(input, auth)
  }

  // --- Thread Domain ---
  listThreads(auth: AuthContext, query: Partial<ThreadListQuery> = {}) {
    return this.threadService.listThreads(auth, query)
  }

  getThread(threadId: string, auth: AuthContext) {
    return this.threadService.getThread(threadId, auth)
  }

  updateThread(threadId: string, input: ThreadUpdateInput, auth: AuthContext) {
    return this.threadService.updateThread(threadId, input, auth)
  }

  deleteThread(threadId: string, auth: AuthContext) {
    return this.threadService.deleteThread(threadId, auth)
  }

  // --- Run Domain ---
  listRuns(auth: AuthContext, query: RunListQuery) {
    return this.runService.listRuns(auth, query)
  }

  getRun(runId: string, auth: AuthContext) {
    return this.runService.getRun(runId, auth)
  }

  cancelRun(runId: string, auth: AuthContext) {
    return this.runService.cancelRun(runId, auth)
  }

  prepareRunResume(runId: string, reason: string | undefined, auth: AuthContext) {
    return this.runService.prepareRunResume(runId, reason, auth)
  }

  listEvents(runId: string, auth: AuthContext, after = 0, limit = 200) {
    return this.runService.listEvents(runId, auth, after, limit)
  }

  // --- Approval Domain ---
  listApprovals(auth: AuthContext, status?: string) {
    return this.approvalService.listApprovals(auth, status)
  }

  hasRecentApprovedHitl(auth: AuthContext) {
    return this.approvalService.hasRecentApprovedHitl(auth)
  }

  issueHitlStepUpToken(auth: AuthContext) {
    return this.approvalService.issueHitlStepUpToken(auth)
  }

  decideApproval(
    id: string,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    return this.approvalService.decideApproval(id, decision, reason, auth)
  }

  decideApprovalByInterrupt(
    interruptId: string,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    return this.approvalService.decideApprovalByInterrupt(interruptId, decision, reason, auth)
  }

  // --- Artifact Domain ---
  async createArtifact(runId: string, input: ArtifactCreateInput, auth: AuthContext) {
    const run = await this.runService.getRun(runId, auth)
    return this.artifactService.createArtifact(runId, run.threadId, input, auth)
  }

  listArtifacts(runId: string, auth: AuthContext) {
    return this.artifactService.listArtifacts(runId, auth)
  }

  getArtifact(artifactId: string, auth: AuthContext) {
    return this.artifactService.getArtifact(artifactId, auth)
  }

  // --- Memory Domain ---
  listMemories(auth: AuthContext) {
    return this.memoryService.listMemories(auth)
  }

  getPromptMemory(auth: AuthContext, threadId?: string) {
    return this.memoryService.getPromptMemory(auth, threadId)
  }

  upsertMemory(input: MemoryUpsertInput, auth: AuthContext) {
    return this.memoryService.upsertMemory(input, auth)
  }

  deleteMemory(id: string, auth: AuthContext) {
    return this.memoryService.deleteMemory(id, auth)
  }

  // --- Metrics Domain ---
  recordEvaluation(runId: string, input: EvaluationCreateInput, auth: AuthContext) {
    return this.metricsService.recordEvaluation(runId, input, auth)
  }

  getMetrics(auth: AuthContext) {
    return this.metricsService.getMetrics(auth)
  }

  reconcile(auth: AuthContext) {
    return this.metricsService.reconcile(auth)
  }
}
