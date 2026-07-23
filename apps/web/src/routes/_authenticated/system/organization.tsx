import { createFileRoute } from '@tanstack/react-router'

import { Organizations } from '@/features/system/organization'

export const Route = createFileRoute('/_authenticated/system/organization')({
  component: Organizations,
  staticData: {
    title: '组织架构',
    icon: 'folder-kanban',
    group: '系统管理',
    order: 30,
    permissions: ['system:org:list']
  }
})
