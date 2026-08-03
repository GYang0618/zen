import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { Settings as SettingsLayout } from '@/features/settings-v2'

export const Route = createFileRoute('/_authenticated/_other/settings-v2')({
  component: SettingsLayout,
  staticData: {
    title: '设置（v2）',
    icon: Settings,
    order: 2
  }
})
