import { createFileRoute } from '@tanstack/react-router'

import { Dashboard } from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
  staticData: {
    title: '概览',
    icon: 'layout-dashboard',
    group: '工作台',
    order: 1,
    affix: true
  }
})
