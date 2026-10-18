import { createFileRoute } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { FileText } from 'lucide-react'
import { z } from 'zod'

import { AuditLogsPage } from '@/features/system/audit'

const auditLogsSearchSchema = z.object({
  agentRunId: z.string().optional().catch(undefined)
})

function AuditLogsRoute() {
  const { agentRunId } = Route.useSearch()
  return <AuditLogsPage initialAgentRunId={agentRunId} />
}

export const Route = createFileRoute('/_authenticated/system/_monitor/audit-logs')({
  component: AuditLogsRoute,
  validateSearch: auditLogsSearchSchema,
  loaderDeps: ({ search }) => search,
  staticData: {
    title: '审计日志',
    description: '查看全系统业务操作、敏感变更、操作主体与执行轨迹',
    icon: FileText,
    order: 10,
    permissions: [PermissionCode.AUDIT_LIST]
  }
})
