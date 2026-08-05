import { Separator } from '@zen/ui'

import { LayoutConfig, SidebarConfig, ThemeConfig } from '@/components/appearance-settings'
import { AppPageHeader } from '@/components/layouts/app-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'

export function AppearancePage() {
  return (
    <SettingsShell>
      <div className="flex flex-col gap-6 pb-6">
        <AppPageHeader />
        <Separator />
      </div>

      <div className="space-y-8">
        <ThemeConfig size="lg" />
        <SidebarConfig size="lg" />
        <LayoutConfig size="lg" />
      </div>
    </SettingsShell>
  )
}
