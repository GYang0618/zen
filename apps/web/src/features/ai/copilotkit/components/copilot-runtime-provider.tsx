import { CopilotKitProvider, useAgentContext } from '@copilotkit/react-core/v2'

import { useEnv } from '@/config/env'
import { useAuthStore } from '@/stores'

import type { PropsWithChildren } from 'react'

export function CopilotRuntimeProvider({ children }: PropsWithChildren) {
  const { copilotKitApi } = useEnv()

  return (
    <CopilotKitProvider runtimeUrl={copilotKitApi} useSingleEndpoint={false}>
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
