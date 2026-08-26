import { CopilotKitProvider, useAgentContext, useCopilotKit } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useMemo } from 'react'

import { useEnv } from '@/config/env'
import { CopilotSharedRegistrations } from '@/features/ai/copilot/components/registrations'
import { authApi } from '@/features/auth'
import { isSessionExpired } from '@/lib/request'
import { useAuthStore } from '@/stores'

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const { copilotKitApi } = useEnv()
  const accessToken = useAuthStore((state) => state.accessToken)

  const headers = useMemo(() => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  }, [accessToken])

  return (
    <CopilotKitProvider runtimeUrl={copilotKitApi} useSingleEndpoint={false} headers={headers}>
      <CopilotRuntimeRegistrations />
      <CopilotSharedRegistrations />
      {children}
      <CopilotAuthRetry />
    </CopilotKitProvider>
  )
}

function CopilotRuntimeRegistrations() {
  const user = useAuthStore((state) => state.user)

  useAgentContext({
    description: '当前登录的用户信息',
    value: user
  })

  return null
}

function CopilotAuthRetry() {
  const navigate = useNavigate()
  const { copilotkit } = useCopilotKit()

  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const refreshAuthSession = useEffectEvent(async () => {
    try {
      const session = await authApi.refresh()
      setAuth(session)
    } catch (error) {
      if (isSessionExpired(error)) {
        clearAuth()
        navigate({
          to: '/sign-in',
          search: { redirect: location.href },
          replace: true
        })
      }
    }
  })

  const regenerate = useEffectEvent((agentId?: string) => {
    if (!agentId) return
    const agent = copilotkit.getAgent(agentId)
    if (!agent) return
    copilotkit.runAgent({ agent })
  })

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onError: async ({ error, context }) => {
        if (!error.message.includes('401')) return
        refreshAuthSession()
        regenerate(context.agentId)
      }
    })

    return () => subscription.unsubscribe()
  }, [copilotkit])

  return null
}
