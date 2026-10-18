import { createFileRoute } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { LogIn } from 'lucide-react'

import { LoginLogsPage } from '@/features/system/audit'

export const Route = createFileRoute('/_authenticated/system/_monitor/login-logs')({
  component: LoginLogsPage,
  staticData: {
    title: '登录日志',
    description: '监控系统用户登录、登出、认证授权与失败锁定事件',
    icon: LogIn,
    order: 20,
    permissions: [PermissionCode.AUDIT_LOGIN, PermissionCode.AUDIT_LIST]
  }
})
