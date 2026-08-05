import { createFileRoute } from '@tanstack/react-router'
import { UserRoundKey } from 'lucide-react'

import { Roles } from '@/features/system/roles-v2/roles'

export const Route = createFileRoute('/_authenticated/system/_identity/roles-v2')({
  component: Roles,
  staticData: {
    title: '角色管理 (V2)',
    description: '管理系统中的所有角色',
    icon: UserRoundKey
  }
})
