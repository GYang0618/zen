import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/system/users'

export const Route = createFileRoute('/_authenticated/system/users')({
  component: Users,
  staticData: {
    title: '用户管理',
    icon: 'users',
    roles: ['admin'],
    group: '系统管理',
    permissions: ['system:user:list']
  }
})
