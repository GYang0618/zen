export type ChatRunState =
  | 'idle'
  | 'composing'
  | 'submitting'
  | 'streaming'
  | 'tool-running'
  | 'waiting-approval'
  | 'reconnecting'
  | 'stopping'
  | 'completed'
  | 'failed'
  | 'cancelled'

export function isRunCancellation(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
  if (record?.name === 'AbortError') return true
  const message =
    error instanceof Error
      ? error.message
      : typeof record?.message === 'string'
        ? record.message
        : typeof error === 'string'
          ? error
          : ''
  return /(?:run\s+)?cancelled|canceled|aborted/i.test(message)
}

export function deriveChatRunState(input: {
  online: boolean
  isRunning: boolean
  recovered: boolean
  persistedStatus?: string
}): ChatRunState {
  if (!input.online) return 'reconnecting'
  if (input.isRunning) return 'streaming'
  if (input.persistedStatus === 'interrupted') return 'waiting-approval'
  if (input.persistedStatus === 'failed' || input.persistedStatus === 'timed_out') return 'failed'
  if (input.persistedStatus === 'cancelled') return 'cancelled'
  if (input.persistedStatus === 'succeeded' || input.recovered) return 'completed'
  return 'idle'
}
