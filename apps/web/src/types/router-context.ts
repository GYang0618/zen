import type { QueryClient } from '@tanstack/react-query'

export interface AppRouterContext {
  queryClient: QueryClient
  auth: {
    getAccessToken: () => string | null
    isAuthenticated: () => boolean
    getPermissions: () => string[]
  }
  plugins: {
    getActiveIds: () => Promise<string[]>
  }
}
