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

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null) {
    const message = (error as Record<string, unknown>).message
    if (typeof message === 'string') return message
  }
  return ''
}

export function isRunCancellation(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
  if (record?.name === 'AbortError') return true
  return /(?:run\s+)?cancelled|canceled|aborted/i.test(readErrorMessage(error))
}

/** LangGraph HITL 会把 GraphInterrupt 写成 RUN_ERROR message=`interrupt`，不能当成失败。 */
export function isRunInterrupt(error: unknown): boolean {
  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
  if (record?.name === 'GraphInterrupt' || record?.type === 'INTERRUPT') return true
  return /^interrupt$/i.test(readErrorMessage(error).trim())
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
