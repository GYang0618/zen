import type { AgentEventRecord, AgentThreadDetail, PersistedAgentMessage } from './runtime-api'

const REASONING_START_TYPES = new Set(['REASONING_START', 'REASONING_MESSAGE_START'])
const REASONING_CONTENT_TYPES = new Set(['REASONING_MESSAGE_CONTENT', 'REASONING_MESSAGE_CHUNK'])

interface RestoredAgentMessage {
  id: string
  role: string
  content: string
  toolCallId?: string
  toolCalls?: unknown[]
}

interface RestoreState {
  messages: RestoredAgentMessage[]
  byId: Map<string, RestoredAgentMessage>
  replayedIds: Set<string>
  pendingReasoning: RestoredAgentMessage[]
}

export function restoreMessages(thread: AgentThreadDetail, events: AgentEventRecord[]) {
  const state = createRestoreState(thread)

  for (const record of events) {
    const type = eventType(record)
    const messageId = eventMessageId(record.payload)
    if (!messageId) continue
    applyRestoreEvent(state, type, messageId, record.payload)
  }

  flushPendingReasoning(state, state.messages.length)
  return state.messages.filter(isVisibleRestoredMessage)
}

function createRestoreState(thread: AgentThreadDetail): RestoreState {
  const messages = thread.messages.map(fromPersistedMessage)
  return {
    messages,
    byId: new Map(messages.map((message) => [message.id, message])),
    replayedIds: new Set<string>(),
    pendingReasoning: []
  }
}

function applyRestoreEvent(
  state: RestoreState,
  type: string,
  messageId: string,
  payload: Record<string, unknown>
) {
  if (REASONING_START_TYPES.has(type)) {
    ensureReasoning(state, messageId)
    return
  }

  if (REASONING_CONTENT_TYPES.has(type) && typeof payload.delta === 'string') {
    const existing = ensureReasoning(state, messageId)
    if (state.replayedIds.has(messageId) && existing.role === 'reasoning') {
      existing.content = `${existing.content}${payload.delta}`
    }
    return
  }

  if (type === 'TEXT_MESSAGE_START') {
    const existingIndex = state.messages.findIndex((message) => message.id === messageId)
    if (existingIndex >= 0) {
      flushPendingReasoning(state, existingIndex)
      return
    }
    flushPendingReasoning(state, state.messages.length)
    const message = { id: messageId, role: 'assistant', content: '' }
    state.messages.push(message)
    state.byId.set(messageId, message)
    state.replayedIds.add(messageId)
    return
  }

  if (type === 'TEXT_MESSAGE_CONTENT' && typeof payload.delta === 'string') {
    if (!state.replayedIds.has(messageId)) return
    const existing = state.byId.get(messageId)
    if (existing?.role === 'assistant') existing.content = `${existing.content}${payload.delta}`
  }
}

function ensureReasoning(state: RestoreState, messageId: string): RestoredAgentMessage {
  const existing = state.byId.get(messageId)
  if (existing) return existing

  const message = { id: messageId, role: 'reasoning', content: '' }
  state.byId.set(messageId, message)
  state.replayedIds.add(messageId)
  state.pendingReasoning.push(message)
  return message
}

function flushPendingReasoning(state: RestoreState, beforeIndex: number) {
  if (state.pendingReasoning.length === 0) return
  state.messages.splice(beforeIndex, 0, ...state.pendingReasoning)
  state.pendingReasoning.length = 0
}

function isVisibleRestoredMessage(message: RestoredAgentMessage): boolean {
  if (message.role === 'reasoning') return Boolean(message.content.trim())
  if (message.role === 'assistant') {
    return Boolean(message.content.trim()) || Boolean(message.toolCalls?.length)
  }
  return true
}

function eventType(record: AgentEventRecord): string {
  return typeof record.payload.type === 'string' ? record.payload.type : record.type
}

function eventMessageId(payload: Record<string, unknown>): string | undefined {
  return typeof payload.messageId === 'string' ? payload.messageId : undefined
}

function fromPersistedMessage(message: PersistedAgentMessage): RestoredAgentMessage {
  return {
    id: message.metadata?.externalId || message.id,
    role: message.role,
    content: message.content,
    ...(message.toolCallId ? { toolCallId: message.toolCallId } : {}),
    ...(message.metadata?.toolCalls ? { toolCalls: message.metadata.toolCalls } : {})
  }
}
