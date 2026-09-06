import { createRouter } from '@tanstack/react-router'

import { RoutePending } from '@/components/route-pending'
import { GeneralError } from '@/features/errors/general-error'
import { fetchActivePluginIds } from '@/features/system/plugins/api'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores'

import { routeTree } from './routeTree.gen'

import type {} from '@/types/router'
import type { AppRouterContext } from '@/types/router-context'

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: {
      getAccessToken: () => useAuthStore.getState().accessToken,
      isAuthenticated: () => useAuthStore.getState().isAuthenticated,
      getPermissions: () => useAuthStore.getState().user?.permissions ?? []
    },
    plugins: {
      getActiveIds: () => fetchActivePluginIds()
    }
  } satisfies AppRouterContext,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: GeneralError,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
