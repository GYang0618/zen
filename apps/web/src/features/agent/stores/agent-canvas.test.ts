import { beforeEach, describe, expect, it } from 'vitest'

import { useAgentCanvasStore } from './agent-canvas'

describe('useAgentCanvasStore', () => {
  beforeEach(() => {
    useAgentCanvasStore.setState({
      isOpen: false,
      activeToolCallId: null
    })
  })

  it('初始状态为闭合且未选中 ToolCall', () => {
    const state = useAgentCanvasStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.activeToolCallId).toBeNull()
  })

  it('setOpen 可以控制面板开闭', () => {
    useAgentCanvasStore.getState().setOpen(true)
    expect(useAgentCanvasStore.getState().isOpen).toBe(true)

    useAgentCanvasStore.getState().setOpen(false)
    expect(useAgentCanvasStore.getState().isOpen).toBe(false)
  })

  it('openToolCall 会同时设置 activeToolCallId 并展开面板', () => {
    useAgentCanvasStore.getState().openToolCall('tool_123')
    const state = useAgentCanvasStore.getState()

    expect(state.isOpen).toBe(true)
    expect(state.activeToolCallId).toBe('tool_123')
  })

  it('close 仅收起面板', () => {
    useAgentCanvasStore.getState().openToolCall('tool_123')
    useAgentCanvasStore.getState().close()

    expect(useAgentCanvasStore.getState().isOpen).toBe(false)
    expect(useAgentCanvasStore.getState().activeToolCallId).toBe('tool_123')
  })
})
