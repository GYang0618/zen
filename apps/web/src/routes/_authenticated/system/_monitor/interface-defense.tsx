import { createFileRoute } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { ShieldAlert } from 'lucide-react'

import { InterfaceDefensePage } from '@/features/system/audit'

export const Route = createFileRoute('/_authenticated/system/_monitor/interface-defense')({
  component: InterfaceDefensePage,
  staticData: {
    title: '接口访问',
    description: '实时监控 API 访问流量、响应耗时、异常拦截与 Agent 调用轨迹',
    icon: ShieldAlert,
    order: 30,
    permissions: [PermissionCode.AUDIT_ACCESS, PermissionCode.AUDIT_LIST]
  }
})
