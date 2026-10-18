import { useNavigate } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { Activity, Bot, FileText, LogIn } from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { AccessLogTable } from './components/access-log-table'
import { AccessStatsCards } from './components/access-stats-cards'
import { AgentUsageView } from './components/agent-usage-view'
import { LoginEventTable } from './components/login-event-table'
import { OperationAuditTable } from './components/operation-audit-table'
import { useAccessStats } from './queries'

export function AuditPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('operations')

  const { data: accessStats, isLoading: accessStatsLoading } = useAccessStats()

  // 跨 Tab 联动：从操作审计或访问日志深钻 Agent 任务详情页
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
          title="审计中心"
          description="覆盖全系统业务操作、身份认证、API 访问轨迹与 AI Agent 用量账本"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="operations" className="gap-2">
              <FileText className="h-4 w-4" />
              <span>操作审计</span>
            </TabsTrigger>
            <TabsTrigger value="logins" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span>登录日志</span>
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Activity className="h-4 w-4" />
              <span>接口访问</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              <span>AI 用量治理</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4">
            <OperationAuditTable onNavigateAgentRun={handleNavigateAgentRun} />
          </TabsContent>

          <TabsContent value="logins" className="space-y-4">
            <LoginEventTable />
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <AccessStatsCards stats={accessStats} isLoading={accessStatsLoading} />
            <AccessLogTable onNavigateAgentRun={handleNavigateAgentRun} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <AgentUsageView onViewDetail={handleNavigateAgentRun} />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
