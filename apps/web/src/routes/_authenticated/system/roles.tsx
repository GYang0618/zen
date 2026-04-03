import { createFileRoute } from '@tanstack/react-router'
import { Roles } from '@/features/system/roles'

export const Route = createFileRoute('/_authenticated/system/roles')({
  component: Roles,
  staticData: {
    title: '用户管理',
    icon: 'i-tabler-users',
    roles: ['admin'],
    permissions: ['system:user:list'],
    group: '系统管理'
  }
})
