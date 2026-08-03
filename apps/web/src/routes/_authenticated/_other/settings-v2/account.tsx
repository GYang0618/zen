import { createFileRoute } from '@tanstack/react-router'
import { Wrench } from 'lucide-react'

import { SettingsAccount } from '@/features/settings-v2/account'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/account')({
  component: SettingsAccount,
  staticData: {
    title: '账户',
    icon: Wrench,
    order: 20
  }
})
