// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import { isAgentChatPath, parseThreadIdFromPath, useShellModeStore } from './shell-mode'

describe('shell-mode store', () => {
  beforeEach(() => {
    localStorage.clear()
    useShellModeStore.setState({
      mode: 'admin',
      lastAdminPath: '/',
      lastAgentPath: '/chat'
    })
  })

  describe('parseThreadIdFromPath', () => {
    it('正确解析有效智能体会话路径中的 threadId', () => {
      expect(parseThreadIdFromPath('/chat/thread-123')).toBe('thread-123')
      expect(parseThreadIdFromPath('/chat/thread-abc?param=1')).toBe('thread-abc')
    })

    it('非会话详情路径返回 undefined', () => {
      expect(parseThreadIdFromPath('/chat')).toBeUndefined()
      expect(parseThreadIdFromPath('/chat/')).toBeUndefined()
      expect(parseThreadIdFromPath('/system/users')).toBeUndefined()
      expect(parseThreadIdFromPath('')).toBeUndefined()
    })
  })

  describe('isAgentChatPath', () => {
    it('正确判断智能体聊天路径', () => {
      expect(isAgentChatPath('/chat')).toBe(true)
      expect(isAgentChatPath('/chat/thread-123')).toBe(true)
      expect(isAgentChatPath('/chat/')).toBe(true)
    })

    it('正确排除非智能体全页路径', () => {
      expect(isAgentChatPath('/chat-v2')).toBe(false)
      expect(isAgentChatPath('/system/users')).toBe(false)
      expect(isAgentChatPath('/')).toBe(false)
      expect(isAgentChatPath('')).toBe(false)
    })
  })

  describe('useShellModeStore state & actions', () => {
    it('支持设置与持久化 mode', () => {
      useShellModeStore.getState().setMode('agent')
      expect(useShellModeStore.getState().mode).toBe('agent')
      expect(localStorage.getItem('zen.shell.mode')).toBe('agent')

      useShellModeStore.getState().setMode('admin')
      expect(useShellModeStore.getState().mode).toBe('admin')
      expect(localStorage.getItem('zen.shell.mode')).toBe('admin')
    })

    it('支持设置与持久化 lastAdminPath 并过滤智能体路径', () => {
      useShellModeStore.getState().setLastAdminPath('/system/roles')
      expect(useShellModeStore.getState().lastAdminPath).toBe('/system/roles')
      expect(localStorage.getItem('zen.shell.last-admin-path')).toBe('/system/roles')

      // 智能体路径不应覆盖 lastAdminPath
      useShellModeStore.getState().setLastAdminPath('/chat/thread-abc')
      expect(useShellModeStore.getState().lastAdminPath).toBe('/system/roles')
    })

    it('支持设置与持久化 lastAgentPath 并过滤非智能体路径', () => {
      useShellModeStore.getState().setLastAgentPath('/chat/thread-xyz')
      expect(useShellModeStore.getState().lastAgentPath).toBe('/chat/thread-xyz')
      expect(localStorage.getItem('zen.shell.last-agent-path')).toBe('/chat/thread-xyz')

      // 非智能体路径不应覆盖 lastAgentPath
      useShellModeStore.getState().setLastAgentPath('/system/users')
      expect(useShellModeStore.getState().lastAgentPath).toBe('/chat/thread-xyz')
    })

    it('支持将 lastAgentPath 重置为 /chat', () => {
      useShellModeStore.getState().setLastAgentPath('/chat/thread-xyz')
      expect(useShellModeStore.getState().lastAgentPath).toBe('/chat/thread-xyz')

      useShellModeStore.getState().setLastAgentPath('/chat')
      expect(useShellModeStore.getState().lastAgentPath).toBe('/chat')
      expect(localStorage.getItem('zen.shell.last-agent-path')).toBe('/chat')
    })
  })
})
