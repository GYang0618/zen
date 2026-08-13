import { createFileRoute } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'

import { RoleDetail } from '@/features/system/roles-v2/role-detail'

export const Route = createFileRoute('/_authenticated/system/_identity/roles_/$id')({
  component: RoleDetail,
  staticData: {
    title: '角色详情',
    description: '配置角色权限矩阵、成员与数据边界',
    icon: KeyRound,
    hideInMenu: true,
    permissions: ['system:role:list']
  }
})
