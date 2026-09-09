import { describe, expect, it } from 'vitest'

import approvalsSource from './use-agent-chat-approvals.ts?raw'
import sessionSource from './use-agent-chat-session.ts?raw'

describe('useAgentChatSession hook contract', () => {
  it('manages thread and run orchestration without rendering concerns', () => {
    expect(sessionSource).toContain('export function useAgentChatSession')
    expect(sessionSource).toContain('useAgent()')
    expect(sessionSource).toContain('useCopilotKit()')
    expect(sessionSource).toContain('.reconcile()')
    expect(sessionSource).toContain('bindHandlers')
    expect(sessionSource).toContain('unbindHandlers')
  })

  it('delegates approval state handling to useAgentChatApprovals', () => {
    expect(sessionSource).toContain("from './use-agent-chat-approvals'")
    expect(sessionSource).toContain('useAgentChatApprovals(agent)')
  })
})

describe('useAgentChatApprovals hook contract', () => {
  it('encapsulates HITL approvals and decision execution', () => {
    expect(approvalsSource).toContain('export function useAgentChatApprovals')
    expect(approvalsSource).toContain('loadPendingApproval')
    expect(approvalsSource).toContain('restorePendingApproval')
    expect(approvalsSource).toContain('resumePersistedApproval')
    expect(approvalsSource).toContain('toHitlResume')
  })
})
