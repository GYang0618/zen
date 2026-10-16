import { createFileRoute } from '@tanstack/react-router'

import { ChangePasswordPage } from '@/features/auth/change-password'
import { ensureAuthenticatedSession } from '@/features/auth/ensure-session'

export const Route = createFileRoute('/(auth)/change-password')({
  beforeLoad: ({ location }) => ensureAuthenticatedSession(location.href),
  component: ChangePasswordPage
})
