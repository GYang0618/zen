import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  DEFAULT_AGENT_VERSIONS
} from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import {
  asRecord,
  clamp,
  decodeThreadCursor,
  encodeThreadCursor,
  findTokenUsage,
  hashJson,
  normalizeRuntimeMessages,
  omitRawEvent,
  parseJson,
  parseRecord,
  percentile,
  serializeError,
  toJson,
  turnIdFor
} from './default-agent-runtime.utils'

import type { Prisma } from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type {
  DefaultAgentRequestContext,
  DefaultAgentRuntimeHooks,
  RuntimeEvent,
  RuntimeRunInput
} from './default-agent-runtime.types'
import type { JsonRecord, NormalizedMessage } from './default-agent-runtime.utils'

const DEFAULT_EVENT_PAGE_SIZE = 200
const MAX_EVENT_PAGE_SIZE = 1_000
const APPROVAL_TTL_MS = 15 * 60 * 1_000
const MAX_PROMPT_MEMORY_CHARS = 6_000
const LEGACY_INTERRUPT_EVENT_NAME = 'on_interrupt'
const INTERRUPT_ID_FIELD = '__zenInterruptId'
const RUN_LEASE_MS = 30_000

export { normalizeRuntimeMessages } from './default-agent-runtime.utils'

@Injectable()
export class DefaultAgentRuntimeStore {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
    const messages = normalizeRuntimeMessages(input.messages)
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
    if (event.type === 'RAW') {
      await this.recordModelUsage(input.runId, event, auth)
      return
    }

    const persistedEvent = omitRawEvent(event)
    const payload = toJson(persistedEvent)
    const sequence = await this.prisma.$transaction(async (tx) => {
      if (
        persistedEvent.type === 'TEXT_MESSAGE_CONTENT' &&
        typeof persistedEvent.delta === 'string' &&
        persistedEvent.delta.length > 0
      ) {
        await tx.agentRun.updateMany({
          where: {
            id: input.runId,
            tenantId: auth.tenantId,
            userId: auth.userId,
            firstTokenAt: null
          },
          data: { firstTokenAt: new Date() }
        })
      }
      const run = await tx.agentRun.update({
        where: { id: input.runId, tenantId: auth.tenantId, userId: auth.userId },
        data: {
          eventSequence: { increment: 1 },
          lastHeartbeatAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + RUN_LEASE_MS)
        },
        select: { eventSequence: true, threadId: true }
      })
      if (run.threadId !== input.threadId) throw new NotFoundException('Agent run not found')
      await tx.agentEvent.create({
        data: {
          runId: input.runId,
          threadId: input.threadId,
          tenantId: auth.tenantId,
          sequence: run.eventSequence,
          type: persistedEvent.type,
          payload
        }
      })
      return run.eventSequence
    })

    await this.applyEvent(input, persistedEvent, auth, sequence)
  }

  async failRun(input: RuntimeRunInput, error: unknown, auth: AuthContext): Promise<void> {
    const message = error instanceof Error ? error.message : ''
    const [status, reason] = /budget exceeded/i.test(message)
      ? ['failed', 'budget_exceeded']
      : /timed out/i.test(message)
        ? ['timed_out', 'timeout']
        : /cancelled|disconnected/i.test(message)
          ? ['cancelled', 'disconnected']
          : ['failed', 'model_error']
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
    const pageSize = clamp(query.limit ?? 30, 1, 100)
    const cursor = query.cursor ? decodeThreadCursor(query.cursor) : undefined
    if (query.cursor && !cursor) {
      throw new BadRequestException('Invalid thread cursor')
    }

    const records = await this.prisma.agentThread.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        agentId: DEFAULT_AGENT_GRAPH_ID,
        ...(cursor
          ? {
              OR: [
                { updatedAt: { lt: cursor.updatedAt } },
                { updatedAt: cursor.updatedAt, id: { lt: cursor.id } }
              ]
            }
          : {})
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      select: {
        id: true,
        title: true,
        status: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true, runs: true } }
      }
    })

    const hasMore = records.length > pageSize
    const items = hasMore ? records.slice(0, pageSize) : records
    const last = items.at(-1)

    return {
      items,
      cursor: last ? encodeThreadCursor(last) : null,
      hasMore
    }
  }

  async listRuns(auth: AuthContext, query: { threadId?: string; status?: string; limit?: number }) {
    return this.prisma.agentRun.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        agentId: DEFAULT_AGENT_GRAPH_ID,
        ...(query.threadId ? { threadId: query.threadId } : {}),
        ...(query.status ? { status: query.status } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: clamp(query.limit ?? 30, 1, 100),
      include: {
        _count: { select: { events: true, toolExecutions: true, approvals: true, artifacts: true } }
      }
    })
  }

  async getRun(runId: string, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      include: {
        turns: { orderBy: { sequence: 'asc' } },
        toolExecutions: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } },
        artifacts: {
          orderBy: { createdAt: 'asc' },
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
        }
      }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    return run
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
    const run = await this.requireRun(runId, auth)
    if (!['failed', 'cancelled', 'timed_out', 'interrupted'].includes(run.status)) {
      throw new BadRequestException('Only stopped runs can be resumed')
    }
    const thread = await this.getThread(run.threadId, auth)
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        resumeCount: { increment: 1 },
        error: reason ? toJson({ resumeReason: reason }) : undefined
      }
    })
    return {
      sourceRunId: runId,
      threadId: run.threadId,
      messages: thread.messages,
      checkpoint: thread.checkpoints[0] ?? null,
      eventCursor: run.eventSequence
    }
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
  }

  async listArtifacts(runId: string, auth: AuthContext) {
    await this.requireRun(runId, auth)
    return this.prisma.agentArtifact.findMany({
      where: { runId, tenantId: auth.tenantId, userId: auth.userId, status: 'available' },
      orderBy: { createdAt: 'asc' },
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
  }

  async getArtifact(artifactId: string, auth: AuthContext) {
    const artifact = await this.prisma.agentArtifact.findFirst({
      where: {
        id: artifactId,
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'available',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    })
    if (!artifact) throw new NotFoundException('Agent artifact not found')
    return artifact
  }

  async getThread(threadId: string, auth: AuthContext) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId },
      include: {
        messages: { orderBy: { sequence: 'asc' } },
        runs: { orderBy: { createdAt: 'desc' }, take: 20 },
        checkpoints: { orderBy: { version: 'desc' }, take: 1 }
      }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
    return thread
  }

  async updateThread(
    threadId: string,
    input: { title?: string; status?: 'active' | 'archived' },
    auth: AuthContext
  ) {
    await this.requireThread(threadId, auth)
    const title = input.title?.trim()
    if (title !== undefined && (title.length === 0 || title.length > 120)) {
      throw new BadRequestException('Thread title must be between 1 and 120 characters')
    }
    return this.prisma.agentThread.update({
      where: { id: threadId },
      data: { ...(title ? { title } : {}), ...(input.status ? { status: input.status } : {}) }
    })
  }

  async deleteThread(threadId: string, auth: AuthContext): Promise<void> {
    const result = await this.prisma.agentThread.deleteMany({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!result.count) throw new NotFoundException('Agent thread not found')
  }

  async listEvents(runId: string, auth: AuthContext, after = 0, limit = DEFAULT_EVENT_PAGE_SIZE) {
    await this.requireRun(runId, auth)
    const items = await this.prisma.agentEvent.findMany({
      where: { runId, tenantId: auth.tenantId, sequence: { gt: Math.max(0, after) } },
      orderBy: { sequence: 'asc' },
      take: clamp(limit, 1, MAX_EVENT_PAGE_SIZE)
    })
    return {
      items,
      cursor: items.at(-1)?.sequence ?? Math.max(0, after),
      hasMore: items.length === clamp(limit, 1, MAX_EVENT_PAGE_SIZE)
    }
  }

  async listApprovals(auth: AuthContext, status?: string) {
    await this.expireApprovals(auth)
    return this.prisma.agentApproval.findMany({
      where: { tenantId: auth.tenantId, userId: auth.userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
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
      status: string
      decision: string | null
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
    return this.prisma.agentMemory.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getPromptMemory(auth: AuthContext, threadId?: string): Promise<string | undefined> {
    const memories = await this.prisma.agentMemory.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        sensitivity: 'non_sensitive',
        shareWithModel: true,
        modelProvider: 'qwen',
        approvedForModelAt: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        AND: [{ OR: [{ threadId: null }, ...(threadId ? [{ threadId }] : [])] }]
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { scope: true, kind: true, key: true, content: true }
    })
    if (!memories.length) return undefined
    return memories
      .map(
        (memory) =>
          `- [${memory.scope}/${memory.kind}] ${memory.key}: ${JSON.stringify(memory.content)}`
      )
      .join('\n')
      .slice(0, MAX_PROMPT_MEMORY_CHARS)
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
    if (!input.scope || !input.kind || !input.key) throw new BadRequestException('Invalid memory')
    if (input.threadId) await this.requireThread(input.threadId, auth)
    const shareWithModel = input.shareWithModel === true
    if (
      shareWithModel &&
      (input.sensitivity !== 'non_sensitive' || input.modelProvider !== 'qwen')
    ) {
      throw new BadRequestException(
        'Only non-sensitive memories explicitly approved for qwen may be shared with the model'
      )
    }
    const consent = {
      sensitivity: input.sensitivity ?? 'private',
      shareWithModel,
      modelProvider: shareWithModel ? 'qwen' : null,
      approvedForModelAt: shareWithModel ? new Date() : null
    } as const
    return this.prisma.agentMemory.upsert({
      where: {
        tenantId_userId_scope_key: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          scope: input.scope,
          key: input.key
        }
      },
      create: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        threadId: input.threadId,
        scope: input.scope,
        kind: input.kind,
        key: input.key,
        content: toJson(input.content),
        ...consent,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
      },
      update: {
        threadId: input.threadId,
        kind: input.kind,
        content: toJson(input.content),
        ...consent,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
      }
    })
  }

  async deleteMemory(id: string, auth: AuthContext): Promise<void> {
    const result = await this.prisma.agentMemory.deleteMany({
      where: { id, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!result.count) throw new NotFoundException('Agent memory not found')
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
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000)
    const [runs, recentRuns, pendingApprovals, tools, scores] = await Promise.all([
      this.prisma.agentRun.groupBy({
        by: ['status'],
        where: { tenantId: auth.tenantId, userId: auth.userId, createdAt: { gte: since } },
        _count: true
      }),
      this.prisma.agentRun.findMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          createdAt: { gte: since },
          startedAt: { not: null },
          endedAt: { not: null }
        },
        select: {
          startedAt: true,
          endedAt: true,
          firstTokenAt: true,
          inputTokens: true,
          outputTokens: true
        },
        take: 1_000
      }),
      this.prisma.agentApproval.count({
        where: { tenantId: auth.tenantId, userId: auth.userId, status: 'pending' }
      }),
      this.prisma.agentToolExecution.groupBy({
        by: ['status'],
        where: {
          tenantId: auth.tenantId,
          createdAt: { gte: since },
          run: { userId: auth.userId }
        },
        _count: true
      }),
      this.prisma.agentEvaluation.aggregate({
        where: {
          tenantId: auth.tenantId,
          createdAt: { gte: since },
          run: { userId: auth.userId }
        },
        _avg: { score: true },
        _count: true
      })
    ])
    const durations = recentRuns
      .map((run) => run.endedAt!.getTime() - run.startedAt!.getTime())
      .sort((a, b) => a - b)
    const firstTokenDurations = recentRuns
      .filter((run) => run.firstTokenAt)
      .map((run) => run.firstTokenAt!.getTime() - run.startedAt!.getTime())
      .sort((a, b) => a - b)
    return {
      window: '24h',
      runs,
      pendingApprovals,
      tools,
      latencyMs: { p50: percentile(durations, 0.5), p95: percentile(durations, 0.95) },
      firstTokenLatencyMs: {
        p50: percentile(firstTokenDurations, 0.5),
        p95: percentile(firstTokenDurations, 0.95)
      },
      tokens: recentRuns.reduce(
        (total, run) => ({
          input: total.input + (run.inputTokens ?? 0),
          output: total.output + (run.outputTokens ?? 0)
        }),
        { input: 0, output: 0 }
      ),
      evaluations: scores
    }
  }

  async reconcile(auth: AuthContext) {
    const staleBefore = new Date(Date.now() - DEFAULT_AGENT_RUN_BUDGET.timeoutMs)
    const now = new Date()
    const rejectedApprovalWhere = {
      tenantId: auth.tenantId,
      userId: auth.userId,
      status: 'rejected',
      decision: 'reject'
    } as const
    const expiredApprovalWhere = {
      tenantId: auth.tenantId,
      userId: auth.userId,
      status: 'pending',
      expiresAt: { lte: now }
    } as const
    const [
      runs,
      turns,
      timedOutTools,
      rejectedApprovalRuns,
      rejectedApprovalTurns,
      rejectedApprovalTools,
      expiredApprovalRuns,
      expiredApprovalTurns,
      expiredApprovalTools,
      expiredApprovals,
      idempotency
    ] = await this.prisma.$transaction([
      this.prisma.agentRun.updateMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: { in: ['pending', 'running', 'finishing'] },
          OR: [
            { leaseExpiresAt: { lte: now } },
            { leaseExpiresAt: null, updatedAt: { lt: staleBefore } }
          ]
        },
        data: { status: 'timed_out', endReason: 'timeout', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running', 'finishing'] },
          updatedAt: { lt: staleBefore },
          run: { tenantId: auth.tenantId, userId: auth.userId }
        },
        data: { status: 'timed_out', endReason: 'timeout', endedAt: now }
      }),
      this.prisma.agentToolExecution.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running'] },
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            status: 'timed_out',
            endReason: 'timeout'
          }
        },
        data: {
          status: 'cancelled',
          errorReason: 'RUN_TIMED_OUT',
          endedAt: now
        }
      }),
      this.prisma.agentRun.updateMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: 'interrupted',
          approvals: { some: rejectedApprovalWhere }
        },
        data: { status: 'cancelled', endReason: 'approval_rejected', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: 'interrupted',
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: rejectedApprovalWhere }
          }
        },
        data: { status: 'cancelled', endReason: 'approval_rejected', endedAt: now }
      }),
      this.prisma.agentToolExecution.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running'] },
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: rejectedApprovalWhere }
          }
        },
        data: {
          status: 'cancelled',
          errorReason: 'APPROVAL_REJECTED',
          endedAt: now
        }
      }),
      this.prisma.agentRun.updateMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: 'interrupted',
          approvals: { some: expiredApprovalWhere }
        },
        data: { status: 'timed_out', endReason: 'approval_expired', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: 'interrupted',
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: expiredApprovalWhere }
          }
        },
        data: { status: 'timed_out', endReason: 'approval_expired', endedAt: now }
      }),
      this.prisma.agentToolExecution.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running'] },
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: expiredApprovalWhere }
          }
        },
        data: {
          status: 'cancelled',
          errorReason: 'APPROVAL_EXPIRED',
          endedAt: now
        }
      }),
      this.prisma.agentApproval.updateMany({
        where: expiredApprovalWhere,
        data: { status: 'expired' }
      }),
      this.prisma.agentIdempotencyRecord.deleteMany({
        where: { tenantId: auth.tenantId, userId: auth.userId, expiresAt: { lte: now } }
      })
    ])
    return {
      timedOutRuns: runs.count,
      timedOutTurns: turns.count,
      timedOutTools: timedOutTools.count,
      rejectedApprovalRuns: rejectedApprovalRuns.count,
      rejectedApprovalTurns: rejectedApprovalTurns.count,
      rejectedApprovalTools: rejectedApprovalTools.count,
      expiredApprovalRuns: expiredApprovalRuns.count,
      expiredApprovalTurns: expiredApprovalTurns.count,
      expiredApprovalTools: expiredApprovalTools.count,
      expiredApprovals: expiredApprovals.count,
      deletedIdempotencyRecords: idempotency.count
    }
  }

  private async applyEvent(
    input: RuntimeRunInput,
    event: RuntimeEvent,
    auth: AuthContext,
    sequence: number
  ): Promise<void> {
    if (event.type === 'MESSAGES_SNAPSHOT' && Array.isArray(event.messages)) {
      const messages = normalizeRuntimeMessages(event.messages)
      await this.prisma.$transaction(async (tx) => {
        await this.persistMessages(
          tx,
          input.threadId,
          turnIdFor(input.runId),
          auth.tenantId,
          messages
        )
        await tx.agentCheckpoint.upsert({
          where: { threadId_version: { threadId: input.threadId, version: sequence } },
          create: {
            threadId: input.threadId,
            runId: input.runId,
            tenantId: auth.tenantId,
            version: sequence,
            state: toJson({ messages })
          },
          update: { state: toJson({ messages }) }
        })
      })
    }

    if (event.type === 'STATE_SNAPSHOT') {
      await this.prisma.agentCheckpoint.upsert({
        where: { threadId_version: { threadId: input.threadId, version: sequence } },
        create: {
          threadId: input.threadId,
          runId: input.runId,
          tenantId: auth.tenantId,
          version: sequence,
          state: toJson(event.snapshot ?? event.state ?? {})
        },
        update: { state: toJson(event.snapshot ?? event.state ?? {}) }
      })
    }

    if (event.type === 'TOOL_CALL_START') await this.startToolExecution(input, event, auth)
    if (event.type === 'TOOL_CALL_ARGS') await this.updateToolArguments(input, event, auth)
    if (event.type === 'TOOL_CALL_RESULT') await this.finishToolExecution(input, event, auth)
    if (event.type === 'CUSTOM' && event.name === LEGACY_INTERRUPT_EVENT_NAME) {
      await this.persistLegacyInterrupt(input, event, auth)
    }

    if (event.type === 'RUN_FINISHED') {
      const outcome = asRecord(event.outcome)
      if (outcome?.type === 'interrupt') {
        await this.persistInterrupts(input, outcome, auth)
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

  private async startToolExecution(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext) {
    const toolCallId = String(event.toolCallId ?? event.id ?? '')
    const toolName = String(event.toolCallName ?? event.name ?? 'unknown_tool')
    if (!toolCallId) return
    await this.prisma.agentToolExecution.upsert({
      where: { runId_toolCallId: { runId: input.runId, toolCallId } },
      create: {
        runId: input.runId,
        tenantId: auth.tenantId,
        toolCallId,
        toolName,
        idempotencyKey: `${input.runId}:${toolCallId}`,
        status: 'running',
        startedAt: new Date()
      },
      update: { status: 'running', startedAt: new Date() }
    })
  }

  private async updateToolArguments(
    input: RuntimeRunInput,
    event: RuntimeEvent,
    auth: AuthContext
  ) {
    const toolCallId = String(event.toolCallId ?? '')
    if (!toolCallId) return
    const args = await this.collectToolArgs(input.runId, toolCallId, auth)
    await this.prisma.agentToolExecution.updateMany({
      where: { runId: input.runId, toolCallId, tenantId: auth.tenantId },
      data: { arguments: toJson(parseJson(args)) }
    })
  }

  private async finishToolExecution(
    input: RuntimeRunInput,
    event: RuntimeEvent,
    auth: AuthContext
  ) {
    const toolCallId = String(event.toolCallId ?? '')
    if (!toolCallId) return
    const result = parseJson(event.content ?? event.result)
    const failed = asRecord(result)?.success === false
    await this.prisma.$transaction([
      this.prisma.agentToolExecution.updateMany({
        where: { runId: input.runId, toolCallId, tenantId: auth.tenantId },
        data: {
          result: toJson(result),
          status: failed ? 'failed' : 'succeeded',
          errorReason: failed ? String(asRecord(result)?.reason ?? 'tool_error') : null,
          endedAt: new Date()
        }
      }),
      this.prisma.agentRun.updateMany({
        where: { id: input.runId, tenantId: auth.tenantId, userId: auth.userId },
        data: failed ? { failureCount: { increment: 1 } } : {}
      })
    ])
  }

  private async collectToolArgs(runId: string, toolCallId: string, auth: AuthContext) {
    const events = await this.prisma.agentEvent.findMany({
      where: { runId, tenantId: auth.tenantId, type: 'TOOL_CALL_ARGS' },
      orderBy: { sequence: 'asc' },
      select: { payload: true }
    })
    return events
      .map(({ payload }) =>
        asRecord(payload)?.toolCallId === toolCallId ? String(asRecord(payload)?.delta ?? '') : ''
      )
      .join('')
  }

  private async persistInterrupts(input: RuntimeRunInput, outcome: JsonRecord, auth: AuthContext) {
    const interrupts = Array.isArray(outcome.interrupts) ? outcome.interrupts : []
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
      await this.prisma.agentApproval.upsert({
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
    }
  }

  private async persistLegacyInterrupt(
    input: RuntimeRunInput,
    event: RuntimeEvent,
    auth: AuthContext
  ) {
    const value = parseRecord(event.value)
    const interruptId =
      typeof value?.[INTERRUPT_ID_FIELD] === 'string' ? value[INTERRUPT_ID_FIELD] : undefined
    const actions = Array.isArray(value?.actionRequests)
      ? value.actionRequests.map(asRecord).filter((action): action is JsonRecord => Boolean(action))
      : []
    if (!interruptId || !actions.length) return
    const toolName = actions.map((action) => String(action.name ?? 'unknown_tool')).join(', ')
    const args = actions.length === 1 ? (actions[0]?.args ?? {}) : { actions }
    const summary = summarizeApproval(toolName, args)
    const expiresAt = new Date(Date.now() + APPROVAL_TTL_MS)

    await this.prisma.agentApproval.upsert({
      where: { runId_toolCallId: { runId: input.runId, toolCallId: interruptId } },
      create: {
        runId: input.runId,
        tenantId: auth.tenantId,
        userId: auth.userId,
        toolCallId: interruptId,
        interruptId,
        toolName,
        ...summary,
        arguments: toJson(args),
        argumentsHash: hashJson(args),
        expiresAt
      },
      update: {
        toolName,
        ...summary,
        arguments: toJson(args),
        argumentsHash: hashJson(args),
        expiresAt
      }
    })
  }

  private async recordModelUsage(runId: string, event: RuntimeEvent, auth: AuthContext) {
    const raw = asRecord(event.event) ?? asRecord(event.rawEvent)
    if (raw?.event !== 'on_chat_model_end') return
    const usage = findTokenUsage(event)
    await this.prisma.agentRun.updateMany({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      data: {
        inputTokens: { increment: usage.inputTokens },
        outputTokens: { increment: usage.outputTokens },
        modelCalls: { increment: 1 }
      }
    })
  }

  private async finishRun(
    runId: string,
    auth: AuthContext,
    status: string,
    endReason: string,
    error?: Prisma.InputJsonValue,
    allowedSourceStatuses?: string[] | true
  ) {
    const now = new Date()
    const sourceStatuses =
      allowedSourceStatuses === true ? ['pending', 'running', 'finishing'] : allowedSourceStatuses
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

  private async expireApprovals(auth: AuthContext) {
    await this.prisma.agentApproval.updateMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'pending',
        expiresAt: { lte: new Date() }
      },
      data: { status: 'expired' }
    })
  }

  private async requireRun(runId: string, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true, threadId: true, status: true, eventSequence: true }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    return run
  }

  private async requireThread(threadId: string, auth: AuthContext) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
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
    riskLevel: destructive ? 'critical' : 'high',
    parameterSummary:
      parameterSummary.length > 500 ? `${parameterSummary.slice(0, 497)}...` : parameterSummary
  }
}
