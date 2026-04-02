import { createFileRoute } from '@tanstack/react-router'
import { AuthLayout } from '@/components/layouts'

export const Route = createFileRoute('/(auth)')({
  component: AuthLayout
})
