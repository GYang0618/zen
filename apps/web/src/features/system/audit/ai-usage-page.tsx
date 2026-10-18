import { useNavigate } from '@tanstack/react-router'
import { Button } from '@zen/ui'
import { RefreshCw } from 'lucide-react'
import { useRef } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { AgentUsageView } from './components/agent-usage-view'

export function AiUsagePage() {
  const navigate = useNavigate()
  const refetchRef = useRef<(() => void) | null>(null)

  const handleViewDetail = (runId: string) => {
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
          title="AI用量治理"
          description="统计 AI Agent 任务流水、Token 消耗分布与多模型费用明细"
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

        <AgentUsageView
          onViewDetail={handleViewDetail}
          onRefetchReady={(fn) => {
            refetchRef.current = fn
          }}
        />
      </Main>
    </>
  )
}
