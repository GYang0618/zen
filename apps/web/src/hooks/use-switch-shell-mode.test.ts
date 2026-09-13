// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
let currentPathname = '/system/users'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: currentPathname } })
}))

import { useShellModeStore } from '@/stores'

import { useSwitchShellMode } from './use-switch-shell-mode'

describe('useSwitchShellMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    currentPathname = '/system/users'
    useShellModeStore.setState({
      mode: 'admin',
      lastAdminPath: '/system/users',
      lastAgentPath: '/chat/thread-active-1'
    })
  })

  it('从 admin 切换至 agent 时，记录 lastAdminPath 并导航至 lastAgentPath', () => {
    currentPathname = '/system/users'
    const { result } = renderHook(() => useSwitchShellMode())

    act(() => {
      result.current.switchMode('agent')
    })

    expect(useShellModeStore.getState().mode).toBe('agent')
    expect(useShellModeStore.getState().lastAdminPath).toBe('/system/users')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/chat/thread-active-1' })
  })

  it('从 agent 切换至 admin 时，记录 lastAgentPath 并导航至 lastAdminPath', () => {
    useShellModeStore.setState({
      mode: 'agent',
      lastAdminPath: '/system/roles',
      lastAgentPath: '/chat'
    })
    currentPathname = '/chat/thread-999'
    const { result } = renderHook(() => useSwitchShellMode())

    act(() => {
      result.current.switchMode('admin')
    })

    expect(useShellModeStore.getState().mode).toBe('admin')
    expect(useShellModeStore.getState().lastAgentPath).toBe('/chat/thread-999')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/system/roles' })
  })

  it('切换到当前相同模式时不执行任何跳转或状态变更', () => {
    const { result } = renderHook(() => useSwitchShellMode())

    act(() => {
      result.current.switchMode('admin')
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
