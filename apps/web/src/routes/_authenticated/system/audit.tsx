import { createFileRoute } from '@tanstack/react-router'

import { AuditPage } from '@/features/system/audit'

export const Route = createFileRoute('/_authenticated/system/audit')({
  component: AuditPage,
  staticData: {
    title: '操作审计',
    icon: 'scroll-text',
    group: '系统管理',
    order: 60,
    permissions: ['system:audit:list']
  }
})
