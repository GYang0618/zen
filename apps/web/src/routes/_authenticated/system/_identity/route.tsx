import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Shield } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/system/_identity')({
  component: () => <Outlet />,
  staticData: {
    title: '组织与权限',
    icon: Shield,
    order: 5,
    hideInBreadcrumb: true
  }
})
