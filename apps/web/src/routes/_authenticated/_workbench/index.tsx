import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'

import { Dashboard } from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/_workbench/')({
  component: Dashboard,
  staticData: {
    title: '概览',
    icon: LayoutDashboard,
    order: 1,
    affix: true
  }
})
