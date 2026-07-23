import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordForm } from '@/features/auth/forgot-password'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPasswordForm
})
