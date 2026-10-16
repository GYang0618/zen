import { useNavigate, useRouterState } from '@tanstack/react-router'

import { resolveAdminPath, useSystemModeStore } from '@/stores'

import type { ShellMode } from '@/stores'
import type { AppPath } from '@/types/router'

export function useSwitchShellMode() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const mode = useSystemModeStore((state) => state.mode)
  const setMode = useSystemModeStore((state) => state.setMode)
  const lastAdminPath = useSystemModeStore((state) => state.lastAdminPath)
  const setLastAdminPath = useSystemModeStore((state) => state.setLastAdminPath)
  const lastAgentPath = useSystemModeStore((state) => state.lastAgentPath)
  const setLastAgentPath = useSystemModeStore((state) => state.setLastAgentPath)

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
    void navigate({ to: resolveAdminPath(lastAdminPath) as AppPath })
  }

  return { mode, switchMode }
}
