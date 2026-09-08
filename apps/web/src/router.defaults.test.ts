import { describe, expect, it } from 'vitest'

import routerSource from './router.ts?raw'
import authRoute from './routes/_authenticated/route.tsx?raw'

describe('TanStack Router defaults', () => {
  it('集中注入 QueryClient、认证和插件 context，并统一 pending/error', () => {
    expect(routerSource).toContain('queryClient')
    expect(routerSource).toContain('getAccessToken')
    expect(routerSource).toContain('getActiveIds')
    expect(routerSource).toContain('defaultPendingComponent: RoutePending')
    expect(routerSource).toContain('defaultErrorComponent: GeneralError')
    expect(authRoute).toContain('pendingComponent: RoutePending')
    expect(authRoute).toContain('errorComponent: GeneralError')
    expect(authRoute).toContain('beforeLoad')
  })
})
