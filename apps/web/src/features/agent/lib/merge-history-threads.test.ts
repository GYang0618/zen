import { describe, expect, it } from 'vitest'

import { isProvisionalThreadNewer, mergeHistoryThreads } from './merge-history-threads'

import type { Thread } from '@copilotkit/react-core/v2'

function thread(partial: Partial<Thread> & { id: string }): Thread {
  return {
    agentId: 'default',
    archived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial
  } as Thread
}

describe('mergeHistoryThreads', () => {
  it('服务端仍是临时标题时，展示本地更新的精炼标题', () => {
    const server = thread({
      id: 't-1',
      name: '请问如何使用系统工作流引擎进行配置',
      updatedAt: '2026-01-01T00:00:01.000Z'
    })
    const provisional = thread({
      id: 't-1',
      name: '工作流配置',
      updatedAt: '2026-01-01T00:00:05.000Z'
    })

    const merged = mergeHistoryThreads([server], [provisional])
    expect(merged[0]?.name).toBe('工作流配置')
  })

  it('服务端已同步同名标题时保留服务端记录', () => {
    const server = thread({
      id: 't-1',
      name: '工作流配置',
      updatedAt: '2026-01-01T00:00:10.000Z'
    })
    const provisional = thread({
      id: 't-1',
      name: '工作流配置',
      updatedAt: '2026-01-01T00:00:05.000Z'
    })

    const merged = mergeHistoryThreads([server], [provisional])
    expect(merged[0]?.name).toBe('工作流配置')
  })
})

describe('isProvisionalThreadNewer', () => {
  it('比较 lastRunAt / updatedAt', () => {
    const server = thread({ id: 'a', updatedAt: '2026-01-01T00:00:01.000Z' })
    const provisional = thread({ id: 'a', updatedAt: '2026-01-01T00:00:02.000Z' })
    expect(isProvisionalThreadNewer(server, provisional)).toBe(true)
  })
})
