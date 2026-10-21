import { createFileRoute, Outlet } from '@tanstack/react-router'
import { BrainCircuit } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/system/_governance')({
  component: () => <Outlet />,
  staticData: {
    title: 'AI治理中心',
    icon: BrainCircuit,
    order: 7,
    hideInBreadcrumb: true
  }
})
