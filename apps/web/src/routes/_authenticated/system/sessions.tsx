import { createFileRoute } from '@tanstack/react-router'

import { Sessions } from '@/features/system/sessions'

export const Route = createFileRoute('/_authenticated/system/sessions')({
  component: Sessions,
  staticData: {
    title: '登录会话',
    icon: 'shield',
    group: '系统管理',
    order: 50,
    permissions: ['system:session:list']
  }
})
