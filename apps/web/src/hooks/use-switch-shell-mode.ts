import { useNavigate, useRouterState } from '@tanstack/react-router'

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
  const lastAgentPath = useShellModeStore((state) => state.lastAgentPath)
  const setLastAgentPath = useShellModeStore((state) => state.setLastAgentPath)

  const switchMode = (next: ShellMode) => {
    if (next === mode) return

    if (next === 'agent') {
      setLastAdminPath(pathname)
      setMode('agent')
      void navigate({ to: (lastAgentPath || '/chat') as AppPath })
      return
    }

    setLastAgentPath(pathname)
    setMode('admin')
    void navigate({ to: (lastAdminPath || '/') as AppPath })
  }

  return { mode, switchMode }
}
