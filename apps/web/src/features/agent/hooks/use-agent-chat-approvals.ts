import { useCopilotKit } from '@copilotkit/react-core/v2'
import { useCallback, useState } from 'react'

import { buildApprovalDecisions, toHitlResume } from '../approval-decision'
import { defaultAgentRuntimeApi } from '../runtime-api'

import type { useAgent } from '@copilotkit/react-core/v2'
import type { AgentApproval } from '../runtime-api'

export async function loadPendingApproval(run: { id: string }): Promise<AgentApproval | null> {
  const detail = await defaultAgentRuntimeApi.getRun(run.id)
  return detail.approvals.find((approval) => approval.status === 'pending') ?? null
}

export async function restorePendingApproval(threadId: string): Promise<AgentApproval | null> {
  const thread = await defaultAgentRuntimeApi.getThread(threadId)
  const latestRun = thread.runs[0]
  if (!latestRun) return null
  return loadPendingApproval(latestRun)
}

export interface UseAgentChatApprovalsReturn {
  awaitingApproval: boolean
  persistedApproval: AgentApproval | null
  setAwaitingApproval: (pending: boolean) => void
  setPersistedApproval: (approval: AgentApproval | null) => void
  clearPersistedApproval: () => void
  resumePersistedApproval: (decision: 'approve' | 'reject') => Promise<void>
  resetApprovals: () => void
}

export function useAgentChatApprovals(
  agent: ReturnType<typeof useAgent>['agent']
): UseAgentChatApprovalsReturn {
  const { copilotkit } = useCopilotKit()
  const [awaitingApproval, setAwaitingApproval] = useState(false)
  const [persistedApproval, setPersistedApproval] = useState<AgentApproval | null>(null)

  const clearPersistedApproval = useCallback(() => setPersistedApproval(null), [])

  const resumePersistedApproval = useCallback(
    async (decision: 'approve' | 'reject') => {
      const decisions = buildApprovalDecisions(1, decision)
      await copilotkit.runAgent({
        agent,
        forwardedProps: { command: { resume: toHitlResume(decisions) } }
      })
      setPersistedApproval(null)
    },
    [agent, copilotkit]
  )

  const resetApprovals = useCallback(() => {
    setAwaitingApproval(false)
    setPersistedApproval(null)
  }, [])

  return {
    awaitingApproval,
    persistedApproval,
    setAwaitingApproval,
    setPersistedApproval,
    clearPersistedApproval,
    resumePersistedApproval,
    resetApprovals
  }
}
