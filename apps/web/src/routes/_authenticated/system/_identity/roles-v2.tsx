import { createFileRoute } from '@tanstack/react-router'
import { UserRoundKey } from 'lucide-react'

import { Roles } from '@/features/system/roles-v2'

export const Route = createFileRoute('/_authenticated/system/_identity/roles-v2')({
  component: Roles,
  staticData: {
    title: '角色管理 (V2)',
    icon: UserRoundKey
  }
})
