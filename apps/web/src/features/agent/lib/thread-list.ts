import type { AgentThreadSummary } from '../runtime-api'

export function sortThreadsByRecent(threads: AgentThreadSummary[]): AgentThreadSummary[] {
  return [...threads].sort((left, right) => {
    const delta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    if (delta !== 0) return delta
    return right.id.localeCompare(left.id)
  })
}

export function mergeThreadPage(
  current: AgentThreadSummary[],
  incoming: AgentThreadSummary[]
): AgentThreadSummary[] {
  const byId = new Map(current.map((thread) => [thread.id, thread]))
  for (const thread of incoming) byId.set(thread.id, thread)
  return sortThreadsByRecent([...byId.values()])
}

export function appendThreadPage(
  current: AgentThreadSummary[],
  incoming: AgentThreadSummary[]
): AgentThreadSummary[] {
  const existingIds = new Set(current.map((thread) => thread.id))
  return [...current, ...incoming.filter((thread) => !existingIds.has(thread.id))]
}

/** 将指定会话更新后提到列表顶部，对应后端 @updatedAt 被刷新。 */
export function promoteThread(
  threads: AgentThreadSummary[],
  threadId: string,
  patch: Partial<AgentThreadSummary>
): AgentThreadSummary[] {
  const current = threads.find((item) => item.id === threadId)
  if (!current) return threads
  return [{ ...current, ...patch }, ...threads.filter((item) => item.id !== threadId)]
}

export const THREAD_TITLE_MAX_LENGTH = 80

export function buildOptimisticThread(id: string, firstMessage: string): AgentThreadSummary {
  const now = new Date().toISOString()
  const title =
    firstMessage.trim().replace(/\s+/g, ' ').slice(0, THREAD_TITLE_MAX_LENGTH) || '新对话'
  return {
    id,
    title,
    status: 'active',
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    _count: { messages: 1, runs: 1 }
  }
}
