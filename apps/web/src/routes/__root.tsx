// import { TanStackDevtools } from '@tanstack/react-devtools'

import { CopilotKit } from '@copilotkit/react-core'
import { createRootRoute, Outlet } from '@tanstack/react-router'

// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { CopilotSidebar } from '@copilotkit/react-core/v2'
import { Toaster } from '@zen/ui'

import { useEnv } from '@/config/env'
// import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundError
  //   errorComponent: GeneralError
})

function RootComponent() {
  const { copilotKitApi } = useEnv()
  return (
    <CopilotKit
      runtimeUrl={copilotKitApi}
      enableInspector={false}
      /** 与 Nest 侧 v2 multi-route（GET …/info 等）一致；默认 true 会走单端点 POST，易与当前后端/CORS 不匹配 */
      useSingleEndpoint={false}
    >
      <Outlet />
      <Toaster />
      <CopilotSidebar defaultOpen={false} />
      {/* <CopilotPopup
        instructions="你是一个有用的助手，请帮助用户解答问题。"
        labels={{ title: 'AI 助手', initial: '你好！有什么我可以帮你的吗？' }}
      /> */}
      {/* <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />
          }
        ]}
      /> */}
    </CopilotKit>
  )
}
