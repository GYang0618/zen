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
  findTokenUsage,
  hashJson,
  normalizeDisplayMessages,
  normalizeRuntimeMessages,
  omitRawEvent,
  parseJson,
  parseRecord,
  serializeError,
  toJson,
  turnIdFor
} from '../default-agent-runtime.utils'
import { AgentThreadService } from './agent-thread.service'

import type { Prisma } from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type { RunListQuery } from '../default-agent-runtime.schemas'
import type { RuntimeEvent, RuntimeRunInput } from '../default-agent-runtime.types'
import type { JsonRecord, NormalizedMessage } from '../default-agent-runtime.utils'

const DEFAULT_EVENT_PAGE_SIZE = 200
const MAX_EVENT_PAGE_SIZE = 1_000
const RUN_LEASE_MS = 30_000
const APPROVAL_TTL_MS = 15 * 60 * 1_000
const LEGACY_INTERRUPT_EVENT_NAME = 'on_interrupt'
const INTERRUPT_ID_FIELD = '__zenInterruptId'

@Injectable()
export class AgentRunService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AgentThreadService) private readonly threadService: AgentThreadService
  ) {}

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

  async listRuns(auth: AuthContext, query: RunListQuery) {
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
    const thread = await this.threadService.getThread(run.threadId, auth)
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
        await tx.agentCheckpoint.upsert({
          where: { threadId_version: { threadId: input.threadId, version: sequence } },
          create: {
            threadId: input.threadId,
            runId: input.runId,
            tenantId: auth.tenantId,
            version: sequence,
            state: toJson({ messages: modelMessages })
          },
          update: { state: toJson({ messages: modelMessages }) }
        })
      })
    }

    if (event.type === 'REASONING_MESSAGE_END' || event.type === 'REASONING_END') {
      await this.persistReasoningFromEvents(input, event, auth)
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
    riskLevel: destructive ? 'critical' : 'high',
    parameterSummary:
      parameterSummary.length > 500 ? `${parameterSummary.slice(0, 497)}...` : parameterSummary
  }
}
