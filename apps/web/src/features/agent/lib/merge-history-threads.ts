import type { Thread } from '@copilotkit/react-core/v2'

function threadSortKey(thread: Thread): string {
  return thread.lastRunAt ?? thread.updatedAt ?? thread.createdAt ?? ''
}

/** 本地乐观项是否比服务端记录更新（用于精炼标题尚未出现在列表接口时）。 */
export function isProvisionalThreadNewer(server: Thread, provisional: Thread): boolean {
  const provAt = threadSortKey(provisional)
  const srvAt = threadSortKey(server)
  return provAt.localeCompare(srvAt) >= 0
}

export function mergeHistoryThreads(
  serverThreads: Thread[],
  provisionalThreads: Thread[]
): Thread[] {
  const byId = new Map<string, Thread>()

  for (const thread of serverThreads) {
    byId.set(thread.id, thread)
  }

  for (const provisional of provisionalThreads) {
    const existing = byId.get(provisional.id)
    if (!existing) {
      byId.set(provisional.id, provisional)
      continue
    }

    const serverName = existing.name?.trim() ?? ''
    const clientName = provisional.name?.trim() ?? ''

    if (!serverName && clientName) {
      byId.set(provisional.id, {
        ...existing,
        name: clientName,
        updatedAt: provisional.updatedAt || existing.updatedAt,
        lastRunAt: provisional.lastRunAt ?? existing.lastRunAt
      })
      continue
    }

    if (
      clientName &&
      clientName !== serverName &&
      isProvisionalThreadNewer(existing, provisional)
    ) {
      byId.set(provisional.id, {
        ...existing,
        name: clientName,
        updatedAt: provisional.updatedAt || existing.updatedAt,
        lastRunAt: provisional.lastRunAt ?? existing.lastRunAt
      })
    }
  }

  return [...byId.values()].sort((left, right) =>
    threadSortKey(right).localeCompare(threadSortKey(left))
  )
}
