import { PermissionCode } from '@zen/shared'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { MonitorSmartphone, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

import { AuditPanel } from '@/features/settings/activity/audit-panel'
import { SessionsPanel } from '@/features/settings/activity/sessions-panel'
import { SettingsShell } from '@/features/settings/components/settings-shell'
import { canAccess } from '@/lib/auth/permissions'

type MainTab = 'sessions' | 'audit'

export function ActivityPage() {
  const canAudit = canAccess([PermissionCode.AUDIT_LIST])
  const [mainTab, setMainTab] = useState<MainTab>('sessions')

  const resolvedMainTab = mainTab === 'audit' && !canAudit ? 'sessions' : mainTab

  return (
    <SettingsShell>
      <div className="flex flex-col gap-6 pb-6">
        <PageHeader className="items-center">
          <PageHeaderContent>
            <PageHeaderTitle size="sm">安全动态</PageHeaderTitle>
            <PageHeaderDescription className="text-sm">
              {canAudit
                ? '管理活跃登录会话，并查询您的操作审计与安全历史。'
                : '查看并管理当前账号的活跃登录会话与设备。'}
            </PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>
        <Separator />
      </div>

      {canAudit ? (
        <Tabs
          value={resolvedMainTab}
          onValueChange={(value) => setMainTab(value as MainTab)}
          className="gap-4"
        >
          <TabsList
            variant="line"
            className="w-full justify-start border-b rounded-none p-0 h-10 gap-6"
          >
            <TabsTrigger value="sessions" className="gap-2 px-1">
              <MonitorSmartphone className="size-4" />
              登录会话
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 px-1">
              <ShieldAlert className="size-4" />
              操作审计
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="mt-4">
            <SessionsPanel />
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AuditPanel />
          </TabsContent>
        </Tabs>
      ) : (
        <SessionsPanel />
      )}
    </SettingsShell>
  )
}
