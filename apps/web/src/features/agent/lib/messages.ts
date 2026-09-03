const RUNNABLE_MESSAGE_ROLES = ['user', 'assistant', 'tool'] as const

type RunnableMessageRole = (typeof RUNNABLE_MESSAGE_ROLES)[number]

function isRunnableMessageRole(role: string): role is RunnableMessageRole {
  return (RUNNABLE_MESSAGE_ROLES as readonly string[]).includes(role)
}

/**
 * 构造重试载荷：保留到最后一条用户消息为止的可回传历史，
 * 丢掉失败回合里未完成的 assistant / reasoning / activity，以及不应回传的 role。
 */
export function buildRetryMessages<T extends { role: string }>(messages: T[]): T[] {
  let lastUserIndex = -1

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      lastUserIndex = index
      break
    }
  }

  if (lastUserIndex === -1) return []

  return messages
    .slice(0, lastUserIndex + 1)
    .filter((message) => isRunnableMessageRole(message.role))
}
