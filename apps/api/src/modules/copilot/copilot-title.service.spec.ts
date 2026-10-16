import { deriveProvisionalThreadTitle } from '@zen/shared'

import { CopilotTitleService } from './copilot-title.service.js'

const { jest } = import.meta

describe('CopilotTitleService', () => {
  let service: CopilotTitleService
  let prisma: {
    agentThread: {
      findFirst: ReturnType<typeof jest.fn>
      update: ReturnType<typeof jest.fn>
    }
  }
  let threadService: {
    ensureThread: ReturnType<typeof jest.fn>
    getThread: ReturnType<typeof jest.fn>
  }

  beforeEach(() => {
    prisma = {
      agentThread: {
        findFirst: jest.fn(),
        update: jest.fn()
      }
    }
    threadService = {
      ensureThread: jest.fn(),
      getThread: jest.fn()
    }
    service = new CopilotTitleService(prisma as never, threadService as never)
  })

  it('空内容时回读已有标题', async () => {
    threadService.getThread.mockResolvedValueOnce({ id: 't-1', name: '已有标题' })

    const result = await service.generateTitleFromContent({
      threadId: 't-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      content: '   '
    })

    expect(result).toEqual({ threadId: 't-1', name: '已有标题' })
    expect(threadService.ensureThread).not.toHaveBeenCalled()
  })

  it('用户手动重命名后的标题不会被覆盖', async () => {
    const content = '请问如何使用系统工作流引擎'
    threadService.ensureThread.mockResolvedValueOnce({
      id: 't-1',
      name: '我手动改的标题'
    })

    const result = await service.generateTitleFromContent({
      threadId: 't-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      content
    })

    expect(result.name).toBe('我手动改的标题')
    expect(prisma.agentThread.update).not.toHaveBeenCalled()
  })

  it('无 API Key 时用临时截断标题写回', async () => {
    const origKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    try {
      const content = '请问如何使用系统工作流引擎'
      const provisional = deriveProvisionalThreadTitle(content)
      threadService.ensureThread.mockResolvedValueOnce({
        id: 't-1',
        name: provisional
      })
      prisma.agentThread.findFirst.mockResolvedValueOnce({ title: provisional })
      prisma.agentThread.update.mockResolvedValueOnce({})

      const result = await service.generateTitleFromContent({
        threadId: 't-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        content
      })

      // 临时标题与最终标题相同，无需再 update
      expect(result).toEqual({ threadId: 't-1', name: provisional })
      expect(prisma.agentThread.update).not.toHaveBeenCalled()
    } finally {
      if (origKey) process.env.OPENAI_API_KEY = origKey
    }
  })
})
