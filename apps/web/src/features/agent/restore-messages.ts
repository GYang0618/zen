import type { AgentEventRecord, AgentThreadDetail, PersistedAgentMessage } from './runtime-api'

export function restoreMessages(thread: AgentThreadDetail, events: AgentEventRecord[]) {
  const messages = thread.messages.map(fromPersistedMessage)
  const byId = new Map(messages.map((message) => [message.id, message]))
  const replayedMessageIds = new Set<string>()

  for (const record of events) {
    const event = record.payload
    const messageId = typeof event.messageId === 'string' ? event.messageId : undefined
    if (!messageId) continue
    if (event.type === 'TEXT_MESSAGE_START' && !byId.has(messageId)) {
      const message = { id: messageId, role: 'assistant' as const, content: '' }
      messages.push(message)
      byId.set(messageId, message)
      replayedMessageIds.add(messageId)
    }
    if (
      event.type === 'TEXT_MESSAGE_CONTENT' &&
      typeof event.delta === 'string' &&
      replayedMessageIds.has(messageId)
    ) {
      const existing = byId.get(messageId)
      if (existing?.role === 'assistant')
        existing.content = `${existing.content ?? ''}${event.delta}`
    }
  }

  return messages.filter(
    (message) =>
      message.role !== 'assistant' || Boolean(message.content?.trim()) || message.toolCalls?.length
  )
}

function fromPersistedMessage(message: PersistedAgentMessage) {
  return {
    id: message.metadata?.externalId || message.id,
    role: message.role,
    content: message.content,
    ...(message.toolCallId ? { toolCallId: message.toolCallId } : {}),
    ...(message.metadata?.toolCalls ? { toolCalls: message.metadata.toolCalls } : {})
  }
}
