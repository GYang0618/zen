import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { AppearancePage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/appearance')({
  component: AppearancePage,
  staticData: {
    title: '外观界面',
    icon: Settings,
    order: 40
  }
})
