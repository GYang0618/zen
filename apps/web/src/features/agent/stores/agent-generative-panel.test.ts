import { beforeEach, describe, expect, it } from 'vitest'

import { useAgentGenerativePanelStore } from './agent-generative-panel'

describe('useAgentGenerativePanelStore', () => {
  beforeEach(() => {
    useAgentGenerativePanelStore.setState({
      isOpen: false,
      activeToolCallId: null
    })
  })

  it('初始状态为闭合且未选中 ToolCall', () => {
    const state = useAgentGenerativePanelStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.activeToolCallId).toBeNull()
  })

  it('setOpen 可以控制面板开闭', () => {
    useAgentGenerativePanelStore.getState().setOpen(true)
    expect(useAgentGenerativePanelStore.getState().isOpen).toBe(true)

    useAgentGenerativePanelStore.getState().setOpen(false)
    expect(useAgentGenerativePanelStore.getState().isOpen).toBe(false)
  })

  it('openToolCall 会同时设置 activeToolCallId 并展开面板', () => {
    useAgentGenerativePanelStore.getState().openToolCall('tool_123')
    const state = useAgentGenerativePanelStore.getState()

    expect(state.isOpen).toBe(true)
    expect(state.activeToolCallId).toBe('tool_123')
  })

  it('close 仅收起面板', () => {
    useAgentGenerativePanelStore.getState().openToolCall('tool_123')
    useAgentGenerativePanelStore.getState().close()

    expect(useAgentGenerativePanelStore.getState().isOpen).toBe(false)
    expect(useAgentGenerativePanelStore.getState().activeToolCallId).toBe('tool_123')
  })
})
