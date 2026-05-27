import { CopilotKitProvider, useAgentContext } from '@copilotkit/react-core/v2'

import { useEnv } from '@/config/env'
import { useAuthStore } from '@/stores'

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const { copilotKitApi } = useEnv()
  const accessToken = useAuthStore((state) => state.accessToken)

  return (
    <CopilotKitProvider
      runtimeUrl={copilotKitApi}
      useSingleEndpoint={false}
      headers={{
        Authorization: `Bearer ${accessToken}`
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
