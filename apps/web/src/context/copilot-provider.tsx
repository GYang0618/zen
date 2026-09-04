import { CopilotKitProvider, useAgentContext, useCopilotKit } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import { useEnv } from '@/config/env'
import { AgentSharedRegistrations } from '@/features/agent/components/registrations'
import { isSessionExpired } from '@/lib/request'
import { refreshAuthSessionOnce } from '@/lib/request/refresh-session'
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
      <AgentSharedRegistrations />
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
  const accessToken = useAuthStore((state) => state.accessToken)
  const pendingAgentIdRef = useRef<string | undefined>(undefined)
  const [retryNonce, setRetryNonce] = useState(0)

  const regenerate = useEffectEvent((agentId?: string) => {
    if (!agentId) return
    const agent = copilotkit.getAgent(agentId)
    if (!agent) return
    copilotkit.runAgent({ agent })
  })

  const recoverFromUnauthorized = useEffectEvent(async (agentId?: string) => {
    pendingAgentIdRef.current = agentId
    try {
      await refreshAuthSessionOnce()
      setRetryNonce((value) => value + 1)
    } catch (error) {
      pendingAgentIdRef.current = undefined
      if (isSessionExpired(error)) {
        navigate({
          to: '/sign-in',
          search: { redirect: location.href },
          replace: true
        })
      }
    }
  })

  useEffect(() => {
    if (retryNonce === 0) return
    const agentId = pendingAgentIdRef.current
    pendingAgentIdRef.current = undefined
    if (!accessToken || !agentId) return
    regenerate(agentId)
  }, [accessToken, retryNonce])

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onError: async ({ error, context }) => {
        if (!error.message.includes('401')) return
        await recoverFromUnauthorized(context.agentId)
      }
    })

    return () => subscription.unsubscribe()
  }, [copilotkit])

  return null
}
