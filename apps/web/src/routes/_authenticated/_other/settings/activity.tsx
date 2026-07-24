import { createFileRoute } from '@tanstack/react-router'
import { ScrollText } from 'lucide-react'

import { ActivityPage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/activity')({
  component: ActivityPage,
  staticData: {
    title: '安全动态',
    icon: ScrollText,
    order: 30
  }
})
