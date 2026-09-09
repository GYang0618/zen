import { describe, expect, it } from 'vitest'

import chatSource from './chat.tsx?raw'

describe('AgentChat architectural boundaries', () => {
  it('chat.tsx should be a concise container component well under 300 lines', () => {
    const lines = chatSource.trim().split('\n').length
    expect(lines).toBeLessThan(120)
  })

  it('delegates session and thread lifecycle orchestration to useAgentChatSession hook', () => {
    expect(chatSource).toContain("from './hooks/use-agent-chat-session'")
    expect(chatSource).toContain('useAgentChatSession()')
    // Ensures heavy side effects were lifted out of chat.tsx
    expect(chatSource).not.toContain('defaultAgentRuntimeApi.listThreads')
    expect(chatSource).not.toContain('defaultAgentRuntimeApi.getThread')
    expect(chatSource).not.toContain('defaultAgentRuntimeApi.reconcile')
  })

  it('composes modular subcomponents ChatConversationView and ChatInputDock', () => {
    expect(chatSource).toContain("from './components/chat-conversation'")
    expect(chatSource).toContain("from './components/chat-input-dock'")
    expect(chatSource).toContain('<ChatConversationView')
    expect(chatSource).toContain('<ChatInputDock')
  })
})
