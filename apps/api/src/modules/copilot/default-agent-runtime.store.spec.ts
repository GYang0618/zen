import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'

import {
  DefaultAgentRuntimeStore,
  normalizeDisplayMessages,
  normalizeRuntimeMessages
} from './default-agent-runtime.store.js'

import type { AuthContext } from '@zen/shared'
import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta

const auth = { tenantId: 'tenant-1', userId: 'user-1' } as AuthContext

function runtimeInput() {
  return {
    threadId: 'thread-1',
    runId: 'run-1',
    messages: [{ id: 'user-1', role: 'user', content: 'hello' }]
  }
}

describe('DefaultAgentRuntimeStore message normalization', () => {
  it('Checkpoint 只保留可回传模型的消息并过滤 reasoning/activity', () => {
    expect(
      normalizeRuntimeMessages([
        { id: 'user-1', role: 'user', content: 'hello' },
        { id: 'reasoning-1', role: 'reasoning', content: 'hidden' },
        { id: 'activity-1', role: 'activity', content: { label: 'working' } },
        { id: 'assistant-1', role: 'assistant', content: 'done' }
      ])
    ).toEqual([
      { id: 'user-1', role: 'user', content: 'hello', toolCallId: undefined, metadata: undefined },
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'done',
        toolCallId: undefined,
        metadata: undefined
      }
    ])
  })

  it('展示历史保留 reasoning，仍过滤 activity', () => {
    expect(
      normalizeDisplayMessages([
        { id: 'user-1', role: 'user', content: 'hello' },
        { id: 'reasoning-1', role: 'reasoning', content: '先查角色' },
        { id: 'activity-1', role: 'activity', content: { label: 'working' } },
        { id: 'assistant-1', role: 'assistant', content: 'done' }
      ])
    ).toEqual([
      { id: 'user-1', role: 'user', content: 'hello', toolCallId: undefined, metadata: undefined },
      {
        id: 'reasoning-1',
        role: 'reasoning',
        content: '先查角色',
        toolCallId: undefined,
        metadata: undefined
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'done',
        toolCallId: undefined,
        metadata: undefined
      }
    ])
  })

  it('规范化多段文本且保留 Tool 元数据', () => {
    expect(
      normalizeRuntimeMessages([
        {
          id: 'assistant-1',
          role: 'assistant',
          content: [
            { type: 'text', text: 'first' },
            { type: 'image', url: 'ignored' },
            { type: 'text', text: 'second' }
          ],
          toolCalls: [{ id: 'call-1' }]
        }
      ])
    ).toEqual([
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'first\nsecond',
        toolCallId: undefined,
        metadata: { toolCalls: [{ id: 'call-1' }] }
      }
    ])
  })
})

describe('DefaultAgentRuntimeStore ownership checks', () => {
  it('在写入前拒绝其他租户拥有的 threadId', async () => {
    const tx = {
      agentThread: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: 'tenant-2',
          userId: 'user-2',
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn()
      },
      agentRun: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      agentTurn: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      agentMessage: { upsert: jest.fn() }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).startRun(runtimeInput(), auth)
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(tx.agentThread.create).not.toHaveBeenCalled()
    expect(tx.agentThread.update).not.toHaveBeenCalled()
    expect(tx.agentRun.findUnique).not.toHaveBeenCalled()
  })

  it('拒绝复用属于其他用户的 runId', async () => {
    const tx = {
      agentThread: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({})
      },
      agentRun: {
        findUnique: jest.fn().mockResolvedValue({
          threadId: 'thread-1',
          tenantId: auth.tenantId,
          userId: 'user-2',
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn()
      },
      agentTurn: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      agentMessage: { upsert: jest.fn() }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).startRun(runtimeInput(), auth)
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(tx.agentRun.create).not.toHaveBeenCalled()
    expect(tx.agentRun.update).not.toHaveBeenCalled()
    expect(tx.agentTurn.findUnique).not.toHaveBeenCalled()
  })

  it('拒绝用相同 runId 重新打开已终止运行', async () => {
    const tx = {
      agentThread: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({})
      },
      agentRun: {
        findUnique: jest.fn().mockResolvedValue({
          threadId: 'thread-1',
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent',
          status: 'cancelled'
        }),
        create: jest.fn(),
        update: jest.fn()
      },
      agentApproval: { count: jest.fn().mockResolvedValue(0) },
      agentTurn: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).startRun(runtimeInput(), auth)
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(tx.agentRun.update).not.toHaveBeenCalled()
    expect(tx.agentTurn.findUnique).not.toHaveBeenCalled()
  })

  it('仅允许已批准审批的 interrupted Run 使用原 runId 继续', async () => {
    const tx = {
      agentThread: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({})
      },
      agentRun: {
        findUnique: jest.fn().mockResolvedValue({
          threadId: 'thread-1',
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent',
          status: 'interrupted'
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({})
      },
      agentApproval: { count: jest.fn().mockResolvedValue(1) },
      agentTurn: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn()
      },
      agentMessage: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn()
      }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).startRun(runtimeInput(), auth)
    ).resolves.toBeUndefined()
    expect(tx.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'running' }) })
    )
  })

  it('恢复后再运行时保留已有消息序列并追加新消息', async () => {
    const messageUpdate = jest.fn().mockResolvedValue({})
    const messageCreate = jest.fn().mockResolvedValue({})
    const tx = {
      agentThread: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({})
      },
      agentRun: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0)
      },
      agentTurn: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn()
      },
      agentMessage: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'thread-1:user-1', sequence: 0 },
          { id: 'thread-1:assistant-1', sequence: 1 }
        ]),
        update: messageUpdate,
        create: messageCreate
      }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).startRun(
      {
        threadId: 'thread-1',
        runId: 'run-2',
        messages: [
          { id: 'assistant-1', role: 'assistant', content: 'previous answer' },
          { id: 'user-2', role: 'user', content: 'next question' }
        ]
      },
      auth
    )

    expect(messageUpdate).toHaveBeenCalledWith({
      where: { id: 'thread-1:assistant-1' },
      data: expect.not.objectContaining({ sequence: expect.anything(), turnId: expect.anything() })
    })
    expect(messageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'thread-1:user-2',
        sequence: 2,
        turnId: 'run-2:turn:0'
      })
    })
  })

  it('新建 Run 时超过并发配额则拒绝', async () => {
    const tx = {
      agentThread: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: auth.tenantId,
          userId: auth.userId,
          agentId: 'default_agent'
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({})
      },
      agentRun: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(3)
      },
      agentTurn: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      agentMessage: { upsert: jest.fn() }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).startRun(runtimeInput(), auth)
    ).rejects.toBeInstanceOf(ConflictException)
    expect(tx.agentRun.create).not.toHaveBeenCalled()
  })
})

describe('DefaultAgentRuntimeStore event persistence', () => {
  it('不持久化 RAW 事件且只在 model-end 统计一次模型与 Token', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const transaction = jest.fn()
    const prisma = {
      $transaction: transaction,
      agentRun: { updateMany }
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).recordEvent(
      runtimeInput(),
      {
        type: 'RAW',
        event: {
          event: 'on_chat_model_stream',
          data: { usage: { input_tokens: 12, output_tokens: 4 } }
        }
      },
      auth
    )
    await new DefaultAgentRuntimeStore(prisma).recordEvent(
      runtimeInput(),
      {
        type: 'RAW',
        event: {
          event: 'on_chat_model_end',
          data: { usage: { input_tokens: 12, output_tokens: 4 } }
        }
      },
      auth
    )

    expect(transaction).not.toHaveBeenCalled()
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          inputTokens: { increment: 12 },
          outputTokens: { increment: 4 },
          modelCalls: { increment: 1 }
        }
      })
    )
    expect(updateMany).toHaveBeenCalledTimes(1)
  })

  it('只在首个非空助手文本增量记录首 Token 时间', async () => {
    const firstTokenUpdate = jest.fn().mockResolvedValue({ count: 1 })
    const tx = {
      agentRun: {
        updateMany: firstTokenUpdate,
        update: jest.fn().mockResolvedValue({ eventSequence: 1, threadId: 'thread-1' })
      },
      agentEvent: { create: jest.fn().mockResolvedValue({}) }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).recordEvent(
      runtimeInput(),
      { type: 'TEXT_MESSAGE_CONTENT', messageId: 'assistant-1', delta: '你好' },
      auth
    )

    expect(firstTokenUpdate).toHaveBeenCalledWith({
      where: {
        id: 'run-1',
        tenantId: auth.tenantId,
        userId: auth.userId,
        firstTokenAt: null
      },
      data: { firstTokenAt: expect.any(Date) }
    })
  })

  it('在 reasoning 结束时把思考正文写入消息表', async () => {
    const messageCreate = jest.fn().mockResolvedValue({})
    const tx = {
      agentRun: {
        updateMany: jest.fn(),
        update: jest.fn().mockResolvedValue({ eventSequence: 3, threadId: 'thread-1' })
      },
      agentEvent: { create: jest.fn().mockResolvedValue({}) },
      agentMessage: {
        findMany: jest.fn().mockResolvedValue([]),
        create: messageCreate,
        update: jest.fn()
      }
    }
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
      agentEvent: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { payload: { type: 'REASONING_MESSAGE_CONTENT', messageId: 'r1', delta: '先核对' } },
            { payload: { type: 'REASONING_MESSAGE_CONTENT', messageId: 'r1', delta: '角色' } },
            { payload: { type: 'REASONING_MESSAGE_CONTENT', messageId: 'r2', delta: '忽略' } }
          ])
      }
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).recordEvent(
      runtimeInput(),
      { type: 'REASONING_MESSAGE_END', messageId: 'r1' },
      auth
    )

    expect(messageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'thread-1:r1',
        role: 'reasoning',
        content: '先核对角色',
        metadata: { externalId: 'r1' }
      })
    })
  })
})

describe('DefaultAgentRuntimeStore artifact ownership', () => {
  it('拒绝在其他用户的 Run 下创建 Artifact', async () => {
    const artifactCreate = jest.fn()
    const prisma = {
      agentRun: { findFirst: jest.fn().mockResolvedValue(null) },
      agentArtifact: { create: artifactCreate }
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).createArtifact(
        'foreign-run',
        { kind: 'tool-result', name: 'result.json', mimeType: 'application/json', content: {} },
        auth
      )
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(artifactCreate).not.toHaveBeenCalled()
  })
})

describe('DefaultAgentRuntimeStore reconciliation', () => {
  it('使用 Lease 过期时间回收卡住的 Run', async () => {
    const runUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const toolUpdateMany = jest.fn().mockResolvedValue({ count: 0 })
    const prisma = {
      agentRun: { updateMany: runUpdateMany },
      agentTurn: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      agentToolExecution: { updateMany: toolUpdateMany },
      agentApproval: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      agentIdempotencyRecord: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations))
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).reconcile(auth)

    expect(runUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ leaseExpiresAt: expect.anything() })
          ])
        })
      })
    )
    expect(toolUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'cancelled',
          errorReason: 'RUN_TIMED_OUT'
        })
      })
    )
  })

  it('收敛已拒绝审批遗留的 Run、Turn 和 Tool 状态', async () => {
    const runUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const turnUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const toolUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const prisma = {
      agentRun: { updateMany: runUpdateMany },
      agentTurn: { updateMany: turnUpdateMany },
      agentToolExecution: { updateMany: toolUpdateMany },
      agentApproval: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      agentIdempotencyRecord: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations))
    } as unknown as PrismaService

    const result = await new DefaultAgentRuntimeStore(prisma).reconcile(auth)

    expect(runUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'interrupted',
          approvals: {
            some: expect.objectContaining({ status: 'rejected', decision: 'reject' })
          }
        }),
        data: expect.objectContaining({ status: 'cancelled', endReason: 'approval_rejected' })
      })
    )
    expect(turnUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'interrupted',
          run: expect.not.objectContaining({ status: expect.anything() })
        }),
        data: expect.objectContaining({ status: 'cancelled', endReason: 'approval_rejected' })
      })
    )
    expect(toolUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['pending', 'running'] },
          run: expect.not.objectContaining({ status: expect.anything() })
        }),
        data: expect.objectContaining({
          status: 'cancelled',
          errorReason: 'APPROVAL_REJECTED'
        })
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        rejectedApprovalRuns: 1,
        rejectedApprovalTurns: 1,
        rejectedApprovalTools: 1
      })
    )
  })

  it('审批过期后更新 Turn 和 Tool 时不依赖 Run 的旧状态', async () => {
    const turnUpdateMany = jest.fn().mockResolvedValue({ count: 0 })
    const toolUpdateMany = jest.fn().mockResolvedValue({ count: 0 })
    const prisma = {
      agentRun: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      agentTurn: { updateMany: turnUpdateMany },
      agentToolExecution: { updateMany: toolUpdateMany },
      agentApproval: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      agentIdempotencyRecord: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations))
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).reconcile(auth)

    expect(turnUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'interrupted',
          run: expect.objectContaining({
            approvals: { some: expect.objectContaining({ status: 'pending' }) }
          })
        }),
        data: expect.objectContaining({ status: 'timed_out', endReason: 'approval_expired' })
      })
    )
    expect(toolUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          run: expect.objectContaining({
            approvals: { some: expect.objectContaining({ status: 'pending' }) }
          })
        }),
        data: expect.objectContaining({ errorReason: 'APPROVAL_EXPIRED' })
      })
    )
  })
})

describe('DefaultAgentRuntimeStore run completion', () => {
  it('取消待审批 Run 时只从允许的源状态转为 cancelled', async () => {
    const runUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const turnUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const toolUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const prisma = {
      agentRun: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'run-1', status: 'interrupted' })
          .mockResolvedValueOnce({ id: 'run-1', status: 'cancelled' }),
        updateMany: runUpdateMany
      },
      agentTurn: { updateMany: turnUpdateMany },
      agentToolExecution: { updateMany: toolUpdateMany },
      agentApproval: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn().mockResolvedValue([{ count: 1 }, { count: 1 }])
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).cancelRun('run-1', auth)

    expect(runUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['pending', 'running', 'finishing', 'interrupted'] }
        }),
        data: expect.objectContaining({ status: 'cancelled', endReason: 'cancelled' })
      })
    )
    expect(toolUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['pending', 'running'] } }),
        data: expect.objectContaining({
          status: 'cancelled',
          errorReason: 'RUN_CANCELLED'
        })
      })
    )
  })

  it('流结束时仍有待审批记录则同步结束 Run 和 Turn 为 interrupted', async () => {
    const runUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const turnUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const prisma = {
      agentApproval: { count: jest.fn().mockResolvedValue(1) },
      agentRun: { updateMany: runUpdateMany },
      agentTurn: { updateMany: turnUpdateMany },
      $transaction: jest.fn().mockResolvedValue([{ count: 1 }, { count: 1 }])
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).completeRunIfOpen(runtimeInput(), auth)

    expect(runUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'interrupted', endReason: 'interrupted' })
      })
    )
    expect(turnUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'interrupted', endReason: 'interrupted' })
      })
    )
  })

  it.each([
    ['Default Agent run timed out', 'timed_out', 'timeout'],
    ['Default Agent run cancelled or disconnected', 'cancelled', 'disconnected'],
    ['model unavailable', 'failed', 'model_error']
  ])('按错误原因分类终态：%s', async (message, status, endReason) => {
    const runUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const turnUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const prisma = {
      agentRun: { updateMany: runUpdateMany },
      agentTurn: { updateMany: turnUpdateMany },
      $transaction: jest.fn().mockResolvedValue([{ count: 1 }, { count: 1 }])
    } as unknown as PrismaService

    await new DefaultAgentRuntimeStore(prisma).failRun(runtimeInput(), new Error(message), auth)

    expect(runUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['pending', 'running', 'finishing'] }
        }),
        data: expect.objectContaining({ status, endReason })
      })
    )
  })
})

describe('DefaultAgentRuntimeStore approval decisions', () => {
  it('拒绝审批后终结原 Run 和挂起的 Tool', async () => {
    const runUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const turnUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const toolUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
    const decided = {
      id: 'approval-1',
      runId: 'run-1',
      status: 'rejected',
      decision: 'reject',
      expiresAt: new Date(Date.now() + 60_000)
    }
    const prisma = {
      agentApproval: {
        findFirst: jest.fn().mockResolvedValue({
          ...decided,
          status: 'pending',
          decision: null
        }),
        update: jest.fn().mockResolvedValue(decided)
      },
      agentRun: { updateMany: runUpdateMany },
      agentTurn: { updateMany: turnUpdateMany },
      agentToolExecution: { updateMany: toolUpdateMany },
      $transaction: jest.fn().mockResolvedValue([{ count: 1 }, { count: 1 }])
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).decideApproval('approval-1', 'reject', undefined, auth)
    ).resolves.toBe(decided)

    expect(runUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['interrupted'] } }),
        data: expect.objectContaining({ status: 'cancelled', endReason: 'approval_rejected' })
      })
    )
    expect(turnUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'cancelled', endReason: 'approval_rejected' })
      })
    )
    expect(toolUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'cancelled',
          errorReason: 'APPROVAL_REJECTED'
        })
      })
    )
  })

  it('过期审批标记为 expired 且不可再决策', async () => {
    const update = jest.fn().mockResolvedValue({ status: 'expired' })
    const prisma = {
      agentApproval: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'approval-1',
          runId: 'run-1',
          toolName: 'delete_users',
          status: 'pending',
          decision: null,
          expiresAt: new Date(Date.now() - 1_000)
        }),
        update
      },
      agentRun: { updateMany: jest.fn() },
      agentTurn: { updateMany: jest.fn() },
      agentToolExecution: { updateMany: jest.fn() },
      $transaction: jest.fn()
    } as unknown as PrismaService

    await expect(
      new DefaultAgentRuntimeStore(prisma).decideApproval('approval-1', 'approve', undefined, auth)
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'approval-1' },
        data: { status: 'expired' }
      })
    )
  })

  it('相同审批决策可以安全重试，冲突决策仍被拒绝', async () => {
    const approval = {
      id: 'approval-1',
      runId: 'run-1',
      status: 'approved',
      decision: 'approve',
      expiresAt: new Date(Date.now() + 60_000)
    }
    const prisma = {
      agentApproval: {
        findFirst: jest.fn().mockResolvedValue(approval),
        update: jest.fn()
      },
      agentRun: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      agentTurn: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      agentToolExecution: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      $transaction: jest.fn().mockResolvedValue([{ count: 0 }, { count: 0 }])
    } as unknown as PrismaService
    const store = new DefaultAgentRuntimeStore(prisma)

    await expect(store.decideApproval('approval-1', 'approve', undefined, auth)).resolves.toBe(
      approval
    )
    await expect(
      store.decideApproval('approval-1', 'reject', undefined, auth)
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})

describe('DefaultAgentRuntimeStore thread listing', () => {
  const threadSelect = {
    id: true,
    title: true,
    status: true,
    lastMessageAt: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { messages: true, runs: true } }
  }

  function thread(id: string, updatedAt: string) {
    return {
      id,
      title: id,
      status: 'active',
      lastMessageAt: new Date(updatedAt),
      createdAt: new Date(updatedAt),
      updatedAt: new Date(updatedAt),
      _count: { messages: 1, runs: 1 }
    }
  }

  it('按 updatedAt 游标分页并报告 hasMore', async () => {
    const first = thread('thread-1', '2026-09-03T10:00:00.000Z')
    const second = thread('thread-2', '2026-09-03T09:00:00.000Z')
    const extra = thread('thread-3', '2026-09-03T08:00:00.000Z')
    const findMany = jest.fn().mockResolvedValue([first, second, extra])
    const store = new DefaultAgentRuntimeStore({
      agentThread: { findMany }
    } as unknown as PrismaService)

    await expect(store.listThreads(auth, { limit: 2 })).resolves.toEqual({
      items: [first, second],
      cursor: '2026-09-03T09:00:00.000Z::thread-2',
      hasMore: true
    })
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: threadSelect
      })
    )
  })

  it('从游标之后继续取下一页', async () => {
    const next = thread('thread-3', '2026-09-03T08:00:00.000Z')
    const findMany = jest.fn().mockResolvedValue([next])
    const store = new DefaultAgentRuntimeStore({
      agentThread: { findMany }
    } as unknown as PrismaService)

    await expect(
      store.listThreads(auth, {
        limit: 2,
        cursor: '2026-09-03T09:00:00.000Z::thread-2'
      })
    ).resolves.toEqual({
      items: [next],
      cursor: '2026-09-03T08:00:00.000Z::thread-3',
      hasMore: false
    })
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { updatedAt: { lt: new Date('2026-09-03T09:00:00.000Z') } },
            { updatedAt: new Date('2026-09-03T09:00:00.000Z'), id: { lt: 'thread-2' } }
          ]
        })
      })
    )
  })

  it('拒绝非法游标', async () => {
    const store = new DefaultAgentRuntimeStore({
      agentThread: { findMany: jest.fn() }
    } as unknown as PrismaService)

    await expect(store.listThreads(auth, { cursor: 'not-a-cursor' })).rejects.toBeInstanceOf(
      BadRequestException
    )
  })
})
