import { createFileRoute } from '@tanstack/react-router'
import { Shield } from 'lucide-react'

import { AccountPage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/account')({
  component: AccountPage,
  staticData: {
    title: '账户与安全',
    icon: Shield,
    order: 20
  }
})
