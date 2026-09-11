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

  const switchMode = (next: ShellMode) => {
    if (next === mode) return

    if (next === 'agent') {
      setLastAdminPath(pathname)
      setMode('agent')
      void navigate({ to: '/chat' })
      return
    }

    setMode('admin')
    void navigate({ to: (lastAdminPath || '/') as AppPath })
  }

  return { mode, switchMode }
}
