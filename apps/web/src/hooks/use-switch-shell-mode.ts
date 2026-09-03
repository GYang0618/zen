import { useNavigate, useRouterState } from '@tanstack/react-router'

import { useAgentChatShellStore } from '@/features/agent/stores/agent-chat-shell'
import { useShellModeStore } from '@/stores'

import type { ShellMode } from '@/stores'
import type { AppPath } from '@/types/router'

export function useSwitchShellMode() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const mode = useShellModeStore((state) => state.mode)
  const setMode = useShellModeStore((state) => state.setMode)
  const lastAdminPath = useShellModeStore((state) => state.lastAdminPath)
  const setLastAdminPath = useShellModeStore((state) => state.setLastAdminPath)

  const switchMode = (next: ShellMode) => {
    if (next === mode) return

    if (next === 'agent') {
      setLastAdminPath(pathname)
      setMode('agent')
      const threadId = useAgentChatShellStore.getState().currentThreadId
      void (threadId
        ? navigate({ to: '/chat/$threadId', params: { threadId } })
        : navigate({ to: '/chat' }))
      return
    }

    setMode('admin')
    void navigate({ to: (lastAdminPath || '/') as AppPath })
  }

  return { mode, switchMode }
}
