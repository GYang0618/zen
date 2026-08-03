import { createFileRoute } from '@tanstack/react-router'
import { MonitorCog } from 'lucide-react'

import { SettingsSystem } from '@/features/settings-v2/system'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/system')({
  component: SettingsSystem,
  staticData: {
    title: '系统',
    icon: MonitorCog,
    order: 50
  }
})
