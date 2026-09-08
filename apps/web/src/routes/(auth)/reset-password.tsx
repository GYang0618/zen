import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ResetPasswordForm } from '@/features/auth/reset-password'

const searchSchema = z.object({
  token: z.string().optional()
})

export const Route = createFileRoute('/(auth)/reset-password')({
  component: ResetPasswordForm,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search
})
