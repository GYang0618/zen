import {
  CopilotKitCoreErrorCode,
  CopilotKitProvider,
  useAgentContext
} from '@copilotkit/react-core/v2'

import { useEnv } from '@/config/env'
import { useAuthStore } from '@/stores'

import type { PropsWithChildren } from 'react'

export function CopilotRuntimeProvider({ children }: PropsWithChildren) {
  const { copilotKitApi } = useEnv()
  const accessToken = useAuthStore((state) => state.accessToken)

  return (
    <CopilotKitProvider
      runtimeUrl={copilotKitApi}
      useSingleEndpoint={false}
      headers={{
        Authorization: `Bearer ${accessToken}`
      }}
      onError={(event) => {
        const { error, code } = event
        const isSessionExpired =
          code === CopilotKitCoreErrorCode.AGENT_RUN_FAILED && error.message.includes('401')
        if (isSessionExpired) {
          console.log('session expired')
        }
      }}
    >
      <CopilotRuntimeRegistrations />
      {children}
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
