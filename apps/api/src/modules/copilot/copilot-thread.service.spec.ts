import { AgentThreadStatus } from '@prisma/client'

import { CopilotThreadService } from './copilot-thread.service.js'

const { jest } = import.meta

describe('CopilotThreadService', () => {
  let service: CopilotThreadService
  let prisma: {
    agentThread: {
      findMany: ReturnType<typeof jest.fn>
      findFirst: ReturnType<typeof jest.fn>
      update: ReturnType<typeof jest.fn>
      deleteMany: ReturnType<typeof jest.fn>
    }
    agentMessage: {
      findMany: ReturnType<typeof jest.fn>
    }
    $transaction: ReturnType<typeof jest.fn>
  }

  beforeEach(() => {
    prisma = {
      agentThread: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn()
      },
      agentMessage: {
        findMany: jest.fn()
      },
      $transaction: jest.fn()
    }
    service = new CopilotThreadService(prisma as never)
  })

  describe('listThreads', () => {
    it('按租户与用户返回活跃状态的会话列表及分页游标', async () => {
      const now = new Date()
      prisma.agentThread.findMany.mockResolvedValueOnce([
        {
          id: 'thread-1',
          title: '会话 1',
          status: AgentThreadStatus.active,
          agentId: 'default',
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now
        }
      ])

      const result = await service.listThreads({
        tenantId: 't-1',
        userId: 'u-1',
        limit: 10
      })

      expect(prisma.agentThread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 't-1',
            userId: 'u-1',
            status: AgentThreadStatus.active
          },
          take: 11
        })
      )
      expect(result.threads).toHaveLength(1)
      expect(result.threads[0]?.id).toBe('thread-1')
      expect(result.threads[0]?.name).toBe('会话 1')
      expect(result.nextCursor).toBeNull()
    })

    it('当结果数量超过 limit 时正确返回 nextCursor', async () => {
      const now = new Date()
      prisma.agentThread.findMany.mockResolvedValueOnce([
        {
          id: 't-1',
          title: 'A',
          status: AgentThreadStatus.active,
          agentId: 'default',
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now
        },
        {
          id: 't-2',
          title: 'B',
          status: AgentThreadStatus.active,
          agentId: 'default',
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now
        }
      ])

      const result = await service.listThreads({
        tenantId: 't-1',
        userId: 'u-1',
        limit: 1
      })

      expect(result.threads).toHaveLength(1)
      expect(result.nextCursor).toBe('t-2')
    })
  })

  describe('updateThread', () => {
    it('重命名会话标题', async () => {
      const now = new Date()
      prisma.agentThread.update.mockResolvedValueOnce({
        id: 't-1',
        title: '新标题',
        status: AgentThreadStatus.active,
        agentId: 'default',
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now
      })

      const res = await service.updateThread({
        threadId: 't-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: '新标题'
      })

      expect(res.name).toBe('新标题')
      expect(prisma.agentThread.update).toHaveBeenCalledWith({
        where: { id: 't-1', tenantId: 'tenant-1', userId: 'user-1' },
        data: { title: '新标题' }
      })
    })
  })

  describe('archiveThread', () => {
    it('将会话标记为归档状态', async () => {
      prisma.agentThread.update.mockResolvedValueOnce({})

      const res = await service.archiveThread({
        threadId: 't-1',
        tenantId: 'tenant-1',
        userId: 'user-1'
      })

      expect(res).toEqual({ threadId: 't-1', archived: true })
      expect(prisma.agentThread.update).toHaveBeenCalledWith({
        where: { id: 't-1', tenantId: 'tenant-1', userId: 'user-1' },
        data: { status: AgentThreadStatus.archived }
      })
    })
  })

  describe('deleteThread', () => {
    it('物理删除指定会话', async () => {
      prisma.agentThread.deleteMany.mockResolvedValueOnce({ count: 1 })

      const res = await service.deleteThread({
        threadId: 't-1',
        tenantId: 'tenant-1',
        userId: 'user-1'
      })

      expect(res).toEqual({ threadId: 't-1', deleted: true })
      expect(prisma.agentThread.deleteMany).toHaveBeenCalledWith({
        where: { id: 't-1', tenantId: 'tenant-1', userId: 'user-1' }
      })
    })
  })

  describe('getThreadMessages', () => {
    it('按 sequence 正序返回会话消息快照', async () => {
      prisma.agentMessage.findMany.mockResolvedValueOnce([
        {
          id: 'msg-1',
          role: 'user',
          content: 'hello',
          metadata: null,
          toolCallId: null
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'world',
          metadata: { toolCalls: [{ id: 'tc-1', name: 'search', args: '{}' }] },
          toolCallId: null
        }
      ])

      const res = await service.getThreadMessages({ threadId: 't-1' })

      expect(res.messages).toHaveLength(2)
      expect(res.messages[0]?.content).toBe('hello')
      expect(res.messages[1]?.toolCalls).toHaveLength(1)
    })
  })

  describe('saveThreadSnapshot', () => {
    it('在事务中更新或插入 Thread 与关联 Messages', async () => {
      const txMock = {
        agentThread: {
          upsert: jest.fn().mockResolvedValue({}),
          updateMany: jest.fn().mockResolvedValue({ count: 1 })
        },
        agentMessage: {
          upsert: jest.fn().mockResolvedValue({}),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 })
        }
      }
      prisma.$transaction.mockImplementationOnce(
        async (fn: (tx: typeof txMock) => Promise<unknown>) => {
          return fn(txMock)
        }
      )

      await service.saveThreadSnapshot({
        threadId: 't-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        agentId: 'default',
        messages: [{ id: 'm-1', role: 'user', content: 'test message' }]
      })

      expect(txMock.agentThread.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't-1' },
          create: expect.objectContaining({
            id: 't-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            title: 'test message'
          })
        })
      )
      expect(txMock.agentThread.updateMany).toHaveBeenCalled()
      expect(txMock.agentMessage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            threadId_sequence: {
              threadId: 't-1',
              sequence: 0
            }
          },
          create: expect.objectContaining({
            id: 'm-1',
            threadId: 't-1',
            role: 'user',
            content: 'test message'
          })
        })
      )
    })
  })
})
