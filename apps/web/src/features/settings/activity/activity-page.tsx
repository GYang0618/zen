import { PermissionCode } from '@zen/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { MonitorSmartphone, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

import { AuditPanel } from '@/features/settings/activity/audit-panel'
import { SessionsPanel } from '@/features/settings/activity/sessions-panel'
import { SettingsPageHeader } from '@/features/settings/components/settings-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'
import { canAccess } from '@/lib/auth/permissions'

type MainTab = 'sessions' | 'audit'

export function ActivityPage() {
  const canAudit = canAccess([PermissionCode.AUDIT_LIST])
  const [mainTab, setMainTab] = useState<MainTab>('sessions')

  const resolvedMainTab = mainTab === 'audit' && !canAudit ? 'sessions' : mainTab

  return (
    <SettingsShell className="max-w-5xl">
      <SettingsPageHeader
        title="安全动态"
        description={
          canAudit
            ? '管理活跃登录会话，并查询租户操作审计与登录历史。'
            : '查看并管理当前账号的活跃登录会话与设备。'
        }
      />

      {canAudit ? (
        <Tabs
          value={resolvedMainTab}
          onValueChange={(value) => setMainTab(value as MainTab)}
          className="gap-4"
        >
          <TabsList>
            <TabsTrigger value="sessions">
              <MonitorSmartphone data-icon="inline-start" />
              登录会话
            </TabsTrigger>
            <TabsTrigger value="audit">
              <ShieldAlert data-icon="inline-start" />
              操作审计
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="mt-0">
            <SessionsPanel />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <AuditPanel />
          </TabsContent>
        </Tabs>
      ) : (
        <SessionsPanel />
      )}
    </SettingsShell>
  )
}
