import type { AuthContext } from '@zen/shared'

export interface RuntimeRunInput {
  threadId: string
  runId: string
  messages?: unknown[]
  state?: unknown
  forwardedProps?: Record<string, unknown>
}

export interface RuntimeEvent {
  type: string
  [key: string]: unknown
}

export interface DefaultAgentRuntimeHooks {
  onStart(input: RuntimeRunInput): Promise<void>
  onEvent(input: RuntimeRunInput, event: RuntimeEvent): Promise<void>
  onError(input: RuntimeRunInput, error: unknown): Promise<void>
  onComplete(input: RuntimeRunInput): Promise<void>
}

export interface DefaultAgentRequestContext {
  auth: AuthContext
  traceId?: string
}
