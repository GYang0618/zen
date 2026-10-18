import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Activity } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/system/_monitor')({
  component: () => <Outlet />,
  staticData: {
    title: '监控与审计',
    icon: Activity,
    order: 6,
    hideInBreadcrumb: true
  }
})
