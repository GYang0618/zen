import { useNavigate } from '@tanstack/react-router'
import { Button } from '@zen/ui'
import { RefreshCw } from 'lucide-react'
import { useRef } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { AccessLogTable } from './components/access-log-table'
import { AccessStatsCards } from './components/access-stats-cards'
import { useAccessStats } from './queries'

export function InterfaceDefensePage() {
  const navigate = useNavigate()
  const {
    data: accessStats,
    isLoading: accessStatsLoading,
    refetch: refetchStats
  } = useAccessStats()
  const refetchTableRef = useRef<(() => void) | null>(null)

  const handleRefresh = () => {
    void refetchStats()
    refetchTableRef.current?.()
  }

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
          title="接口访问"
          description="实时监控 API 访问流量、响应耗时、异常拦截与 Agent 调用轨迹"
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
          }
        />

        <AccessStatsCards stats={accessStats} isLoading={accessStatsLoading} />
        <AccessLogTable
          onNavigateAgentRun={handleNavigateAgentRun}
          onRefetchReady={(fn) => {
            refetchTableRef.current = fn
          }}
        />
      </Main>
    </>
  )
}
