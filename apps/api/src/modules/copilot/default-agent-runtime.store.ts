import { randomUUID } from 'node:crypto'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional
} from '@nestjs/common'
import { AgentRiskLevel, AgentRunStatus as AgentRunStatusValue } from '@prisma/client'
import {
  AGENT_HITL_STEP_UP_WINDOW_MS,
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  DEFAULT_AGENT_VERSIONS
} from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'
import { DefaultAgentApprovalService } from './default-agent-approval.service.js'
import { DefaultAgentArtifactService } from './default-agent-artifact.service.js'
import { DefaultAgentCheckpointService } from './default-agent-checkpoint.service.js'
import { DefaultAgentEventService } from './default-agent-event.service.js'
import { DefaultAgentMemoryService } from './default-agent-memory.service.js'
import { DefaultAgentMetricsService } from './default-agent-metrics.service.js'
import { DefaultAgentReconciliationService } from './default-agent-reconciliation.service.js'
import { DefaultAgentRunService } from './default-agent-run.service.js'
import {
  asRecord,
  hashJson,
  normalizeDisplayMessages,
  normalizeRuntimeMessages,
  serializeError,
  toJson,
  turnIdFor
} from './default-agent-runtime.utils.js'
import { DefaultAgentThreadService } from './default-agent-thread.service.js'
import { DefaultAgentToolLedgerService } from './default-agent-tool-ledger.service.js'

import type {
  AgentApprovalDecision,
  AgentApprovalStatus,
  AgentEndReason,
  AgentRunStatus,
  Prisma
} from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type {
  DefaultAgentRequestContext,
  DefaultAgentRuntimeHooks,
  RuntimeEvent,
  RuntimeRunInput
} from './default-agent-runtime.types.js'
import type { JsonRecord, NormalizedMessage } from './default-agent-runtime.utils.js'

const DEFAULT_EVENT_PAGE_SIZE = 200
const MAX_EVENT_PAGE_SIZE = 1_000
const APPROVAL_TTL_MS = 15 * 60 * 1_000
const RUN_LEASE_MS = 30_000

export {
  normalizeDisplayMessages,
  normalizeRuntimeMessages
} from './default-agent-runtime.utils.js'

@Injectable()
export class DefaultAgentRuntimeStore {
  private readonly artifactService: DefaultAgentArtifactService
  private readonly approvalService: DefaultAgentApprovalService
  private readonly checkpointService: DefaultAgentCheckpointService
  private readonly eventService: DefaultAgentEventService
  private readonly memoryService: DefaultAgentMemoryService
  private readonly metricsService: DefaultAgentMetricsService
  private readonly reconciliationService: DefaultAgentReconciliationService
  private readonly runService: DefaultAgentRunService
  private readonly threadService: DefaultAgentThreadService
  private readonly toolLedgerService: DefaultAgentToolLedgerService

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(DefaultAgentArtifactService) artifactService?: DefaultAgentArtifactService,
    @Optional() @Inject(DefaultAgentApprovalService) approvalService?: DefaultAgentApprovalService,
    @Optional()
    @Inject(DefaultAgentCheckpointService)
    checkpointService?: DefaultAgentCheckpointService,
    @Optional() @Inject(DefaultAgentEventService) eventService?: DefaultAgentEventService,
    @Optional() @Inject(DefaultAgentMemoryService) memoryService?: DefaultAgentMemoryService,
    @Optional() @Inject(DefaultAgentMetricsService) metricsService?: DefaultAgentMetricsService,
    @Optional()
    @Inject(DefaultAgentReconciliationService)
    reconciliationService?: DefaultAgentReconciliationService,
    @Optional() @Inject(DefaultAgentRunService) runService?: DefaultAgentRunService,
    @Optional() @Inject(DefaultAgentThreadService) threadService?: DefaultAgentThreadService,
    @Optional()
    @Inject(DefaultAgentToolLedgerService)
    toolLedgerService?: DefaultAgentToolLedgerService
  ) {
    this.artifactService = artifactService ?? new DefaultAgentArtifactService(prisma)
    this.approvalService = approvalService ?? new DefaultAgentApprovalService(prisma)
    this.checkpointService = checkpointService ?? new DefaultAgentCheckpointService(prisma)
    this.eventService = eventService ?? new DefaultAgentEventService(prisma)
    this.memoryService = memoryService ?? new DefaultAgentMemoryService(prisma)
    this.metricsService = metricsService ?? new DefaultAgentMetricsService(prisma)
    this.reconciliationService =
      reconciliationService ?? new DefaultAgentReconciliationService(prisma)
    this.runService = runService ?? new DefaultAgentRunService(prisma)
    this.threadService = threadService ?? new DefaultAgentThreadService(prisma)
    this.toolLedgerService = toolLedgerService ?? new DefaultAgentToolLedgerService(prisma)
  }

  createHooks(context: DefaultAgentRequestContext): DefaultAgentRuntimeHooks {
    return {
      onStart: (input) => this.startRun(input, context.auth, context.traceId),
      onEvent: (input, event) => this.recordEvent(input, event, context.auth),
      onError: (input, error) => this.failRun(input, error, context.auth),
      onComplete: (input) => this.completeRunIfOpen(input, context.auth)
    }
  }

  async startRun(input: RuntimeRunInput, auth: AuthContext, traceId?: string): Promise<void> {
    const now = new Date()
    const messages = normalizeDisplayMessages(input.messages)
    const title = messages.find((message) => message.role === 'user')?.content.slice(0, 60)
    const turnId = turnIdFor(input.runId)

    await this.prisma.$transaction(async (tx) => {
      const existingThread = await tx.agentThread.findUnique({
        where: { id: input.threadId },
        select: { tenantId: true, userId: true, agentId: true }
      })
      if (
        existingThread &&
        (existingThread.tenantId !== auth.tenantId ||
          existingThread.userId !== auth.userId ||
          existingThread.agentId !== DEFAULT_AGENT_GRAPH_ID)
      ) {
        throw new NotFoundException('Agent thread not found')
      }

      if (existingThread) {
        await tx.agentThread.update({
          where: { id: input.threadId },
          data: {
            lastMessageAt: messages.length ? now : undefined,
            status: 'active'
          }
        })
      } else {
        await tx.agentThread.create({
          data: {
            id: input.threadId,
            tenantId: auth.tenantId,
            userId: auth.userId,
            agentId: DEFAULT_AGENT_GRAPH_ID,
            title: title || '新对话',
            lastMessageAt: messages.length ? now : null
          }
        })
      }

      const existingRun = await tx.agentRun.findUnique({
        where: { id: input.runId },
        select: { threadId: true, tenantId: true, userId: true, agentId: true, status: true }
      })
      if (
        existingRun &&
        (existingRun.threadId !== input.threadId ||
          existingRun.tenantId !== auth.tenantId ||
          existingRun.userId !== auth.userId ||
          existingRun.agentId !== DEFAULT_AGENT_GRAPH_ID)
      ) {
        throw new NotFoundException('Agent run not found')
      }
      if (existingRun && !['pending', 'running', 'finishing'].includes(existingRun.status)) {
        const resumableApproval =
          existingRun.status === 'interrupted' &&
          (await tx.agentApproval.count({
            where: {
              runId: input.runId,
              tenantId: auth.tenantId,
              userId: auth.userId,
              status: 'approved'
            }
          })) > 0
        if (!resumableApproval) throw new BadRequestException('Agent run has already finished')
      }

      if (existingRun) {
        await tx.agentRun.update({
          where: { id: input.runId },
          data: {
            status: 'running',
            endReason: null,
            error: undefined,
            endedAt: null,
            traceId,
            lastHeartbeatAt: now,
            leaseOwner: traceId ?? `api:${process.pid}`,
            leaseExpiresAt: new Date(now.getTime() + RUN_LEASE_MS)
          }
        })
      } else {
        const activeRuns = await tx.agentRun.count({
          where: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            status: { in: ['pending', 'running', 'finishing'] }
          }
        })
        if (activeRuns >= DEFAULT_AGENT_RUN_BUDGET.maxConcurrentRuns) {
          throw new ConflictException('Agent concurrency quota exceeded')
        }
        await tx.agentRun.create({
          data: {
            id: input.runId,
            threadId: input.threadId,
            tenantId: auth.tenantId,
            userId: auth.userId,
            agentId: DEFAULT_AGENT_GRAPH_ID,
            status: 'running',
            budget: toJson(DEFAULT_AGENT_RUN_BUDGET),
            traceId,
            modelVersion: DEFAULT_AGENT_VERSIONS.model,
            promptVersion: DEFAULT_AGENT_VERSIONS.prompt,
            toolSchemaVersion: DEFAULT_AGENT_VERSIONS.toolSchema,
            lastHeartbeatAt: now,
            leaseOwner: traceId ?? `api:${process.pid}`,
            leaseExpiresAt: new Date(now.getTime() + RUN_LEASE_MS),
            startedAt: now
          }
        })
      }

      const existingTurn = await tx.agentTurn.findUnique({
        where: { id: turnId },
        select: { runId: true, tenantId: true }
      })
      if (
        existingTurn &&
        (existingTurn.runId !== input.runId || existingTurn.tenantId !== auth.tenantId)
      ) {
        throw new NotFoundException('Agent turn not found')
      }

      if (existingTurn) {
        await tx.agentTurn.update({
          where: { id: turnId },
          data: { status: 'running', endReason: null, endedAt: null }
        })
      } else {
        await tx.agentTurn.create({
          data: {
            id: turnId,
            runId: input.runId,
            tenantId: auth.tenantId,
            sequence: 0,
            status: 'running',
            startedAt: now
          }
        })
      }

      await this.persistMessages(tx, input.threadId, turnId, auth.tenantId, messages)
    })
  }

  async recordEvent(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext): Promise<void> {
    const result = await this.eventService.record(input, event, auth)
    if (result) await this.applyEvent(input, result.event, auth, result.sequence)
  }

  async failRun(input: RuntimeRunInput, error: unknown, auth: AuthContext): Promise<void> {
    const message = error instanceof Error ? error.message : ''
    const [status, reason]: [AgentRunStatus, AgentEndReason] = /budget exceeded/i.test(message)
      ? [AgentRunStatusValue.failed, 'budget_exceeded']
      : /timed out/i.test(message)
        ? [AgentRunStatusValue.timed_out, 'timeout']
        : /cancelled|disconnected/i.test(message)
          ? [AgentRunStatusValue.cancelled, 'disconnected']
          : [AgentRunStatusValue.failed, 'model_error']
    await this.finishRun(input.runId, auth, status, reason, serializeError(error), true)
  }

  async completeRunIfOpen(input: RuntimeRunInput, auth: AuthContext): Promise<void> {
    const pendingApprovals = await this.prisma.agentApproval.count({
      where: {
        runId: input.runId,
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'pending'
      }
    })
    await this.finishRun(
      input.runId,
      auth,
      pendingApprovals ? 'interrupted' : 'succeeded',
      pendingApprovals ? 'interrupted' : 'completed',
      undefined,
      true
    )
  }

  async listThreads(auth: AuthContext, query: { limit?: number; cursor?: string } = {}) {
    return this.threadService.list(auth, query)
  }

  async listRuns(auth: AuthContext, query: { threadId?: string; status?: string; limit?: number }) {
    return this.runService.list(auth, query)
  }

  async getRun(runId: string, auth: AuthContext) {
    return this.runService.get(runId, auth)
  }

  async cancelRun(runId: string, auth: AuthContext) {
    const run = await this.requireRun(runId, auth)
    if (['succeeded', 'failed', 'cancelled', 'timed_out'].includes(run.status)) return run
    await this.finishRun(runId, auth, 'cancelled', 'cancelled', undefined, [
      'pending',
      'running',
      'finishing',
      'interrupted'
    ])
    await this.prisma.agentApproval.updateMany({
      where: { runId, tenantId: auth.tenantId, userId: auth.userId, status: 'pending' },
      data: { status: 'cancelled', decision: null }
    })
    await this.prisma.agentToolExecution.updateMany({
      where: {
        runId,
        tenantId: auth.tenantId,
        status: { in: ['pending', 'running'] }
      },
      data: {
        status: 'cancelled',
        errorReason: 'RUN_CANCELLED',
        endedAt: new Date()
      }
    })
    return this.requireRun(runId, auth)
  }

  async prepareRunResume(runId: string, reason: string | undefined, auth: AuthContext) {
    return this.runService.prepareResume(runId, reason, auth)
  }

  async createArtifact(
    runId: string,
    input: {
      toolCallId?: string
      kind: string
      name: string
      mimeType: string
      summary?: string
      content: unknown
    },
    auth: AuthContext
  ) {
    return this.artifactService.create(runId, input, auth)
    /* istanbul ignore next -- compatibility implementation retained below for old fixtures */
    /*
    const run = await this.requireRun(runId, auth)
    const serialized = JSON.stringify(input.content ?? null)
    const toolExecution = input.toolCallId
      ? await this.prisma.agentToolExecution.findFirst({
          where: { runId, toolCallId: input.toolCallId, tenantId: auth.tenantId },
          select: { id: true }
        })
      : null
    return this.prisma.agentArtifact.create({
      data: {
        runId,
        threadId: run.threadId,
        tenantId: auth.tenantId,
        userId: auth.userId,
        toolExecutionId: toolExecution?.id,
        kind: input.kind,
        name: input.name,
        mimeType: input.mimeType,
        size: Buffer.byteLength(serialized),
        summary: input.summary,
        content: toJson(input.content)
      },
      select: {
        id: true,
        runId: true,
        threadId: true,
        toolExecutionId: true,
        kind: true,
        name: true,
        mimeType: true,
        size: true,
        summary: true,
        status: true,
        createdAt: true
      }
    })
    */
  }

  async listArtifacts(runId: string, auth: AuthContext) {
    return this.artifactService.list(runId, auth)
  }

  async getArtifact(artifactId: string, auth: AuthContext) {
    return this.artifactService.get(artifactId, auth)
  }

  async getThread(threadId: string, auth: AuthContext) {
    return this.threadService.get(threadId, auth)
  }

  async updateThread(
    threadId: string,
    input: { title?: string; status?: 'active' | 'archived' },
    auth: AuthContext
  ) {
    return this.threadService.update(threadId, input, auth)
  }

  async deleteThread(threadId: string, auth: AuthContext): Promise<void> {
    return this.threadService.delete(threadId, auth)
  }

  async listEvents(runId: string, auth: AuthContext, after = 0, limit = DEFAULT_EVENT_PAGE_SIZE) {
    return this.eventService.list(runId, auth, after, Math.min(limit, MAX_EVENT_PAGE_SIZE))
  }

  async listApprovals(auth: AuthContext, status?: string) {
    return this.approvalService.list(auth, status)
  }

  async hasRecentApprovedHitl(auth: AuthContext): Promise<boolean> {
    return this.approvalService.recentApproved(auth)
  }

  async getStepUpGrant(auth: AuthContext, runId: string) {
    return this.approvalService.getStepUpGrant(auth, runId)
  }

  async decideApproval(
    id: string,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    const approval = await this.prisma.agentApproval.findFirst({
      where: { id, tenantId: auth.tenantId, userId: auth.userId }
    })
    return this.applyApprovalDecision(approval, decision, reason, auth)
  }

  async decideApprovalByInterrupt(
    interruptId: string,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    const approval = await this.prisma.agentApproval.findFirst({
      where: { interruptId, tenantId: auth.tenantId, userId: auth.userId },
      orderBy: { createdAt: 'desc' }
    })
    return this.applyApprovalDecision(approval, decision, reason, auth)
  }

  private async applyApprovalDecision(
    approval: {
      id: string
      runId: string
      toolName: string
      status: AgentApprovalStatus
      decision: AgentApprovalDecision | null
      expiresAt: Date
    } | null,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    if (!approval) throw new NotFoundException('Agent approval not found')
    if (approval.status !== 'pending') {
      if (approval.decision === decision) {
        if (decision === 'reject') await this.finalizeRejectedApproval(approval.runId, auth)
        return approval
      }
      throw new BadRequestException('Approval has been decided')
    }
    if (approval.expiresAt <= new Date()) {
      await this.prisma.agentApproval.update({
        where: { id: approval.id },
        data: { status: 'expired' }
      })
      throw new BadRequestException('Approval has expired')
    }
    const decidedApproval = await this.prisma.agentApproval.update({
      where: { id: approval.id },
      data: {
        status: decision === 'approve' ? 'approved' : 'rejected',
        decision,
        reason,
        decidedBy: auth.userId,
        decidedAt: new Date()
      }
    })
    if (decision === 'reject') {
      await this.finalizeRejectedApproval(approval.runId, auth)
    } else {
      await this.prisma.agentStepUpGrant.create({
        data: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          runId: approval.runId,
          toolName: approval.toolName,
          approvalId: approval.id,
          nonce: randomUUID(),
          expiresAt: new Date(Date.now() + AGENT_HITL_STEP_UP_WINDOW_MS)
        }
      })
    }
    return decidedApproval
  }

  private async finalizeRejectedApproval(runId: string, auth: AuthContext) {
    await this.finishRun(runId, auth, 'cancelled', 'approval_rejected', undefined, ['interrupted'])
    await this.prisma.agentToolExecution.updateMany({
      where: {
        runId,
        tenantId: auth.tenantId,
        status: { in: ['pending', 'running'] }
      },
      data: {
        status: 'cancelled',
        errorReason: 'APPROVAL_REJECTED',
        endedAt: new Date()
      }
    })
  }

  async listMemories(auth: AuthContext) {
    return this.memoryService.list(auth)
  }

  async getPromptMemory(auth: AuthContext, threadId?: string): Promise<string | undefined> {
    return this.memoryService.getPrompt(auth, threadId)
  }

  async upsertMemory(
    input: {
      scope: string
      kind: string
      key: string
      content: unknown
      threadId?: string
      expiresAt?: string
      sensitivity?: 'private' | 'non_sensitive'
      shareWithModel?: boolean
      modelProvider?: 'qwen'
    },
    auth: AuthContext
  ) {
    return this.memoryService.upsert(input, auth)
  }

  async deleteMemory(id: string, auth: AuthContext): Promise<void> {
    return this.memoryService.delete(id, auth)
  }

  async recordEvaluation(
    runId: string,
    input: { evaluator: string; metric: string; score: number; details?: unknown },
    auth: AuthContext
  ) {
    await this.requireRun(runId, auth)
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > 1) {
      throw new BadRequestException('Evaluation score must be between 0 and 1')
    }
    return this.prisma.agentEvaluation.upsert({
      where: {
        runId_evaluator_metric: { runId, evaluator: input.evaluator, metric: input.metric }
      },
      create: {
        runId,
        tenantId: auth.tenantId,
        evaluator: input.evaluator,
        metric: input.metric,
        score: input.score,
        details: input.details === undefined ? undefined : toJson(input.details)
      },
      update: {
        score: input.score,
        details: input.details === undefined ? undefined : toJson(input.details)
      }
    })
  }

  async getMetrics(auth: AuthContext) {
    return this.metricsService.get(auth)
  }

  async reconcile(auth: AuthContext) {
    return this.reconciliationService.reconcile(auth)
  }

  private async applyEvent(
    input: RuntimeRunInput,
    event: RuntimeEvent,
    auth: AuthContext,
    sequence: number
  ): Promise<void> {
    if (event.type === 'MESSAGES_SNAPSHOT' && Array.isArray(event.messages)) {
      const displayMessages = normalizeDisplayMessages(event.messages)
      const modelMessages = normalizeRuntimeMessages(event.messages)
      await this.prisma.$transaction(async (tx) => {
        await this.persistMessages(
          tx,
          input.threadId,
          turnIdFor(input.runId),
          auth.tenantId,
          displayMessages
        )
        await this.checkpointService.upsertInTransaction(tx, {
          threadId: input.threadId,
          runId: input.runId,
          tenantId: auth.tenantId,
          version: sequence,
          state: { messages: modelMessages }
        })
      })
    }

    if (event.type === 'REASONING_MESSAGE_END' || event.type === 'REASONING_END') {
      await this.persistReasoningFromEvents(input, event, auth)
    }

    if (event.type === 'STATE_SNAPSHOT') {
      await this.checkpointService.upsertProjection({
        threadId: input.threadId,
        runId: input.runId,
        tenantId: auth.tenantId,
        version: sequence,
        state: event.snapshot ?? event.state ?? {}
      })
    }

    if (event.type === 'TOOL_CALL_START') await this.toolLedgerService.start(input, event, auth)
    if (event.type === 'TOOL_CALL_ARGS')
      await this.toolLedgerService.updateArguments(input, event, auth)
    if (event.type === 'TOOL_CALL_RESULT') await this.toolLedgerService.finish(input, event, auth)

    if (event.type === 'RUN_FINISHED') {
      const outcome = asRecord(event.outcome)
      if (outcome?.type === 'interrupt') {
        await this.persistInterrupts(input, outcome, auth, sequence)
        await this.finishRun(input.runId, auth, 'interrupted', 'interrupted', undefined, true)
      } else {
        const pendingApprovals = await this.prisma.agentApproval.count({
          where: {
            runId: input.runId,
            tenantId: auth.tenantId,
            userId: auth.userId,
            status: 'pending'
          }
        })
        await this.finishRun(
          input.runId,
          auth,
          pendingApprovals ? 'interrupted' : 'succeeded',
          pendingApprovals ? 'interrupted' : 'completed',
          undefined,
          true
        )
      }
    }
    if (event.type === 'RUN_ERROR') {
      await this.finishRun(input.runId, auth, 'failed', 'model_error', toJson(event), true)
    }
  }

  private async persistInterrupts(
    input: RuntimeRunInput,
    outcome: JsonRecord,
    auth: AuthContext,
    sequence: number
  ) {
    const interrupts = Array.isArray(outcome.interrupts) ? outcome.interrupts : []
    await this.prisma.$transaction(async (tx) => {
      await this.checkpointService.upsertInTransaction(tx, {
        threadId: input.threadId,
        runId: input.runId,
        tenantId: auth.tenantId,
        version: sequence,
        state: { interrupts: outcome.interrupts ?? [] },
        summary: 'hitl-interrupt'
      })
      for (const value of interrupts) {
        const interrupt = asRecord(value)
        if (!interrupt) continue
        const metadata = asRecord(interrupt.metadata)
        const hitl = asRecord(metadata?.value ?? metadata)
        const requests = Array.isArray(hitl?.actionRequests) ? hitl.actionRequests : []
        const request = asRecord(requests[0])
        const toolCallId = String(interrupt.toolCallId ?? interrupt.id ?? '')
        const interruptId = String(interrupt.id ?? toolCallId)
        if (!toolCallId || !interruptId) continue
        const toolName = String(request?.name ?? metadata?.toolName ?? 'unknown_tool')
        const args = request?.args ?? metadata?.args ?? {}
        const summary = summarizeApproval(toolName, args)
        const expiresAt = interrupt.expiresAt
          ? new Date(String(interrupt.expiresAt))
          : new Date(Date.now() + APPROVAL_TTL_MS)
        await tx.agentApproval.upsert({
          where: { runId_toolCallId: { runId: input.runId, toolCallId } },
          create: {
            runId: input.runId,
            tenantId: auth.tenantId,
            userId: auth.userId,
            toolCallId,
            interruptId,
            toolName,
            ...summary,
            arguments: toJson(args),
            argumentsHash: hashJson(args),
            expiresAt
          },
          update: {
            interruptId,
            toolName,
            ...summary,
            arguments: toJson(args),
            argumentsHash: hashJson(args),
            expiresAt
          }
        })
        await tx.agentToolExecution.updateMany({
          where: { runId: input.runId, toolCallId, tenantId: auth.tenantId, status: 'running' },
          data: { status: 'pending' }
        })
      }
    })
  }

  private async finishRun(
    runId: string,
    auth: AuthContext,
    status: AgentRunStatus,
    endReason: AgentEndReason,
    error?: Prisma.InputJsonValue,
    allowedSourceStatuses?: AgentRunStatus[] | true
  ) {
    const now = new Date()
    const sourceStatuses =
      allowedSourceStatuses === true
        ? [AgentRunStatusValue.pending, AgentRunStatusValue.running, AgentRunStatusValue.finishing]
        : allowedSourceStatuses
    const statusGuard = sourceStatuses ? { status: { in: sourceStatuses } } : {}
    await this.prisma.$transaction([
      this.prisma.agentRun.updateMany({
        where: { id: runId, tenantId: auth.tenantId, userId: auth.userId, ...statusGuard },
        data: { status, endReason, error, endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          runId,
          tenantId: auth.tenantId,
          run: { userId: auth.userId },
          ...statusGuard
        },
        data: { status, endReason, endedAt: now }
      })
    ])
  }

  private async persistReasoningFromEvents(
    input: RuntimeRunInput,
    event: RuntimeEvent,
    auth: AuthContext
  ) {
    const messageId = typeof event.messageId === 'string' ? event.messageId : ''
    if (!messageId) return

    const contentEvents = await this.prisma.agentEvent.findMany({
      where: {
        runId: input.runId,
        tenantId: auth.tenantId,
        type: 'REASONING_MESSAGE_CONTENT'
      },
      orderBy: { sequence: 'asc' },
      select: { payload: true }
    })
    const content = contentEvents
      .map((item) => asRecord(item.payload))
      .filter((payload) => payload?.messageId === messageId && typeof payload.delta === 'string')
      .map((payload) => String(payload?.delta))
      .join('')
    if (!content.trim()) return

    await this.prisma.$transaction(async (tx) => {
      await this.persistMessages(tx, input.threadId, turnIdFor(input.runId), auth.tenantId, [
        { id: messageId, role: 'reasoning', content }
      ])
    })
  }

  private async persistMessages(
    tx: Prisma.TransactionClient,
    threadId: string,
    turnId: string,
    tenantId: string,
    messages: NormalizedMessage[]
  ) {
    const persistedMessages = await tx.agentMessage.findMany({
      where: { threadId },
      select: { id: true, sequence: true }
    })
    const persistedIds = new Set(persistedMessages.map((message) => message.id))
    let nextSequence = persistedMessages.reduce(
      (maximum, message) => Math.max(maximum, message.sequence + 1),
      0
    )

    for (const message of messages) {
      const id = `${threadId}:${message.id}`
      const data = {
        role: message.role,
        content: message.content,
        toolCallId: message.toolCallId,
        metadata: toJson({ externalId: message.id, ...message.metadata })
      }
      if (persistedIds.has(id)) {
        await tx.agentMessage.update({ where: { id }, data })
      } else {
        await tx.agentMessage.create({
          data: {
            ...data,
            id,
            threadId,
            turnId,
            tenantId,
            sequence: nextSequence
          }
        })
        persistedIds.add(id)
        nextSequence += 1
      }
    }
  }

  private async requireRun(runId: string, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true, threadId: true, status: true, eventSequence: true }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    return run
  }
}

const APPROVAL_OPERATION_LABELS: Record<string, string> = {
  delete_users: '删除用户',
  hard_delete_users: '彻底删除用户',
  restore_deleted_users: '恢复已删除用户',
  update_user_status: '批量修改用户状态',
  reset_user_password: '重置用户密码',
  revoke_user_sessions: '强制用户下线',
  assign_user_roles: '分配用户角色',
  replace_user_organizations: '替换用户组织归属',
  delete_roles: '删除角色',
  add_role_members: '批量添加角色成员',
  assign_role_permissions: '修改角色权限',
  assign_role_data_scope: '修改角色数据范围',
  change_organization_parent: '调整组织层级',
  remove_organization_member: '移除组织成员',
  remove_organization_position: '删除组织编制',
  delete_job_profile: '删除岗位档案'
}

function summarizeApproval(toolName: string, args: unknown) {
  const record = asRecord(args)
  const ids = Array.isArray(record?.ids)
    ? record.ids
    : [record?.id, record?.userId, record?.roleId, record?.organizationId].filter(Boolean)
  const count = ids.length || 1
  const destructive = /delete|remove/.test(toolName)
  const operation = toolName
    .split(',')
    .map((name) => APPROVAL_OPERATION_LABELS[name.trim()] ?? name.trim())
    .join('、')
  const parameterSummary = JSON.stringify(args ?? {})
  return {
    operation,
    targetSummary: ids.length ? `${count} 个对象：${ids.slice(0, 3).join('、')}` : '当前选定对象',
    impactSummary: destructive
      ? `将删除 ${count} 个对象，可能影响关联数据`
      : `将修改 ${count} 个对象的业务数据`,
    riskLevel: destructive ? AgentRiskLevel.critical : AgentRiskLevel.high,
    parameterSummary:
      parameterSummary.length > 500 ? `${parameterSummary.slice(0, 497)}...` : parameterSummary
  }
}
