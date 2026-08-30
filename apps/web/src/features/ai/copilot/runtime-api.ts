import { request } from '@/lib/request'

export interface AgentThreadSummary {
  id: string
  title: string | null
  status: string
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  _count: { messages: number; runs: number }
}

export interface PersistedAgentMessage {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string | null
  metadata?: { externalId?: string; toolCalls?: unknown[] } | null
}

export interface AgentThreadDetail extends AgentThreadSummary {
  messages: PersistedAgentMessage[]
  runs: Array<{ id: string; status: string; endReason: string | null; eventSequence: number }>
  checkpoints: Array<{ state: unknown; version: number }>
}

export interface AgentApproval {
  id: string
  runId: string
  interruptId: string
  toolCallId: string
  toolName: string
  operation?: string | null
  targetSummary?: string | null
  impactSummary?: string | null
  riskLevel?: string | null
  parameterSummary?: string | null
  arguments: unknown
  status: string
  expiresAt: string
}

export interface AgentArtifact {
  id: string
  runId: string
  threadId: string
  toolExecutionId: string | null
  kind: string
  name: string
  mimeType: string
  size: number
  summary: string | null
  status: string
  content?: unknown
  createdAt: string
}

export interface AgentToolExecution {
  id: string
  toolCallId: string
  toolName: string
  status: string
  arguments: unknown
  result: unknown
  errorReason: string | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
}

export interface AgentRunSummary {
  id: string
  threadId: string
  status: string
  endReason: string | null
  eventSequence: number
  inputTokens: number
  outputTokens: number
  modelCalls: number
  failureCount: number
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { events: number; toolExecutions: number; approvals: number; artifacts: number }
}

export interface AgentRunDetail extends AgentRunSummary {
  turns: Array<{ id: string; status: string; endReason: string | null }>
  toolExecutions: AgentToolExecution[]
  approvals: AgentApproval[]
  artifacts: AgentArtifact[]
}

export interface AgentRunResumeContext {
  sourceRunId: string
  threadId: string
  messages: PersistedAgentMessage[]
  checkpoint: { state: unknown; version: number } | null
  eventCursor: number
}

export interface AgentEventRecord {
  sequence: number
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

export const defaultAgentRuntimeApi = {
  reconcile: () =>
    request.post<{
      timedOutRuns: number
      timedOutTurns: number
      expiredApprovalRuns: number
      expiredApprovalTurns: number
      expiredApprovalTools: number
      expiredApprovals: number
      deletedIdempotencyRecords: number
    }>('/copilot/runtime/maintenance/reconcile'),
  listThreads: () => request.get<AgentThreadSummary[]>('/copilot/runtime/threads'),
  getThread: (threadId: string) =>
    request.get<AgentThreadDetail>(`/copilot/runtime/threads/${threadId}`),
  listEvents: async (runId: string, after = 0) => {
    const items: AgentEventRecord[] = []
    let cursor = after
    let hasMore = true
    while (hasMore) {
      const page = await request.get<{
        items: AgentEventRecord[]
        cursor: number
        hasMore: boolean
      }>(`/copilot/runtime/runs/${runId}/events`, { params: { after: cursor, limit: 1000 } })
      items.push(...page.items)
      if (page.cursor <= cursor) break
      cursor = page.cursor
      hasMore = page.hasMore
    }
    return { items, cursor, hasMore: false }
  },
  listRuns: (params: { threadId?: string; status?: string; limit?: number } = {}) =>
    request.get<AgentRunSummary[]>('/copilot/runtime/runs', { params }),
  getRun: (runId: string) =>
    request.get<AgentRunDetail>(`/copilot/runtime/runs/${runId}`),
  cancelRun: (runId: string) =>
    request.post<AgentRunDetail>(`/copilot/runtime/runs/${runId}/cancel`),
  prepareRunResume: (runId: string, reason?: string) =>
    request.post<AgentRunResumeContext>(`/copilot/runtime/runs/${runId}/resume`, {
      ...(reason ? { reason } : {})
    }),
  listArtifacts: (runId: string) =>
    request.get<AgentArtifact[]>(`/copilot/runtime/runs/${runId}/artifacts`),
  getArtifact: (artifactId: string) =>
    request.get<AgentArtifact>(`/copilot/runtime/artifacts/${artifactId}`),
  updateThread: (threadId: string, body: { title?: string; status?: 'active' | 'archived' }) =>
    request.patch<AgentThreadSummary>(`/copilot/runtime/threads/${threadId}`, body),
  deleteThread: (threadId: string) => request.delete(`/copilot/runtime/threads/${threadId}`),
  listApprovals: (status = 'pending') =>
    request.get<AgentApproval[]>('/copilot/runtime/approvals', { params: { status } }),
  decideApproval: (id: string, body: { decision: 'approve' | 'reject'; reason?: string }) =>
    request.post<AgentApproval>(`/copilot/runtime/approvals/${id}/decision`, body),
  decideApprovalByInterrupt: (
    interruptId: string,
    body: { decision: 'approve' | 'reject'; reason?: string }
  ) =>
    request.post<AgentApproval>(
      `/copilot/runtime/approvals/by-interrupt/${interruptId}/decision`,
      body
    )
}
