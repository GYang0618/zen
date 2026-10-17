import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'

import { AuditPage } from '@/features/system/audit'

export const Route = createFileRoute('/_authenticated/system/audit')({
  component: AuditPage,
  staticData: {
    title: '审计中心',
    description: '查看业务操作审计、登录日志、接口访问轨迹与 AI Agent 用量账本',
    icon: ShieldCheck,
    order: 50,
    permissions: ['system:audit:list']
  }
})
