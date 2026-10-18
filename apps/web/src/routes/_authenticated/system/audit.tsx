import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/system/audit')({
  beforeLoad: () => {
    throw redirect({ to: '/system/audit-logs' })
  },
  staticData: {
    hideInMenu: true
  }
})
