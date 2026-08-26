import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { Settings as SettingsLayout } from '@/features/settings-v2'

export const Route = createFileRoute('/_authenticated/_other/settings')({
  component: SettingsLayout,
  staticData: {
    title: '设置',
    description: '管理您的个人资料、账号安全凭证、系统界面外观与通知提醒。',
    icon: Settings,
    order: 1
  }
})
