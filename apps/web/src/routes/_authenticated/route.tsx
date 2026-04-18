import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthenticatedLayout } from '@/components/layouts'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) return

    try {
      const session = await authApi.refresh()
      useAuthStore.getState().setAuth(session)
    } catch {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true
      })
    }
  },
  component: AuthenticatedLayout
})
