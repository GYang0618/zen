import { CopilotThreadController } from './copilot-thread.controller.js'

import type { AuthContext } from '@zen/shared'

const { jest } = import.meta

describe('CopilotThreadController', () => {
  let controller: CopilotThreadController
  let service: {
    listThreads: ReturnType<typeof jest.fn>
    updateThread: ReturnType<typeof jest.fn>
    archiveThread: ReturnType<typeof jest.fn>
    deleteThread: ReturnType<typeof jest.fn>
    getThreadMessages: ReturnType<typeof jest.fn>
  }
  let titleService: {
    generateTitleFromContent: ReturnType<typeof jest.fn>
  }

  const mockAuth: AuthContext = {
    tenantId: 'tenant-123',
    userId: 'user-456',
    departmentId: null,
    isSuperAdmin: false,
    permissions: [],
    roles: [],
    permVer: 1
  }

  beforeEach(() => {
    service = {
      listThreads: jest.fn(),
      updateThread: jest.fn(),
      archiveThread: jest.fn(),
      deleteThread: jest.fn(),
      getThreadMessages: jest.fn()
    }
    titleService = {
      generateTitleFromContent: jest.fn()
    }
    controller = new CopilotThreadController(service as never, titleService as never)
  })

  it('listThreads 携带当前用户与租户隔离参数', async () => {
    service.listThreads.mockResolvedValueOnce({ threads: [], nextCursor: null })

    const res = await controller.listThreads(mockAuth, 'default', 'false', '20', 'c-1')

    expect(service.listThreads).toHaveBeenCalledWith({
      tenantId: 'tenant-123',
      userId: 'user-456',
      agentId: 'default',
      includeArchived: false,
      limit: 20,
      cursor: 'c-1'
    })
    expect(res).toEqual({ threads: [], nextCursor: null })
  })

  it('generateTitle 转发首条消息精炼请求', async () => {
    titleService.generateTitleFromContent.mockResolvedValueOnce({
      threadId: 't-1',
      name: '精炼标题'
    })

    const res = await controller.generateTitle(mockAuth, 't-1', {
      content: '帮我配置主题',
      agentId: 'default'
    })

    expect(titleService.generateTitleFromContent).toHaveBeenCalledWith({
      threadId: 't-1',
      tenantId: 'tenant-123',
      userId: 'user-456',
      agentId: 'default',
      content: '帮我配置主题'
    })
    expect(res).toEqual({ threadId: 't-1', name: '精炼标题' })
  })

  it('updateThread 转发重命名请求', async () => {
    service.updateThread.mockResolvedValueOnce({ id: 't-1', name: '新标题' })

    const res = await controller.updateThread(mockAuth, 't-1', { name: '新标题' })

    expect(service.updateThread).toHaveBeenCalledWith({
      threadId: 't-1',
      tenantId: 'tenant-123',
      userId: 'user-456',
      name: '新标题'
    })
    expect(res).toEqual({ id: 't-1', name: '新标题' })
  })

  it('archiveThread 转发归档请求', async () => {
    service.archiveThread.mockResolvedValueOnce({ threadId: 't-1', archived: true })

    const res = await controller.archiveThread(mockAuth, 't-1')

    expect(service.archiveThread).toHaveBeenCalledWith({
      threadId: 't-1',
      tenantId: 'tenant-123',
      userId: 'user-456'
    })
    expect(res).toEqual({ threadId: 't-1', archived: true })
  })

  it('deleteThread 转发删除请求', async () => {
    service.deleteThread.mockResolvedValueOnce({ threadId: 't-1', deleted: true })

    const res = await controller.deleteThread(mockAuth, 't-1')

    expect(service.deleteThread).toHaveBeenCalledWith({
      threadId: 't-1',
      tenantId: 'tenant-123',
      userId: 'user-456'
    })
    expect(res).toEqual({ threadId: 't-1', deleted: true })
  })

  it('getThreadMessages 转发消息获取请求', async () => {
    service.getThreadMessages.mockResolvedValueOnce({ messages: [] })

    const res = await controller.getThreadMessages(mockAuth, 't-1')

    expect(service.getThreadMessages).toHaveBeenCalledWith({
      threadId: 't-1',
      tenantId: 'tenant-123',
      userId: 'user-456'
    })
    expect(res).toEqual({ messages: [] })
  })
})
