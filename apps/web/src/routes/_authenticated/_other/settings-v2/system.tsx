import { createFileRoute } from '@tanstack/react-router'
import { MonitorCog } from 'lucide-react'

import { SettingsSystem } from '@/features/settings-v2/system'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/system')({
  component: SettingsSystem,
  staticData: {
    title: '系统',
    description: '管理你的系统logo、名称、版权等信息。',
    icon: MonitorCog,
    order: 50
  }
})
