import { useNavigate } from '@tanstack/react-router'
import { Button } from '@zen/ui'
import { RefreshCw } from 'lucide-react'
import { useRef } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { OperationAuditTable } from './components/operation-audit-table'

interface AuditLogsPageProps {
  initialAgentRunId?: string
}

export function AuditLogsPage({ initialAgentRunId }: AuditLogsPageProps) {
  const navigate = useNavigate()
  const refetchRef = useRef<(() => void) | null>(null)

  const handleNavigateAgentRun = (runId: string) => {
    void navigate({
      to: '/system/ai-usage/$id',
      params: { id: runId }
    })
  }

  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader
          title="审计日志"
          description="覆盖全系统业务操作、敏感变更、操作主体与执行轨迹"
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => refetchRef.current?.()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
          }
        />

        <OperationAuditTable
          key={initialAgentRunId ?? 'all'}
          initialAgentRunId={initialAgentRunId}
          onNavigateAgentRun={handleNavigateAgentRun}
          onRefetchReady={(fn) => {
            refetchRef.current = fn
          }}
        />
      </Main>
    </>
  )
}
