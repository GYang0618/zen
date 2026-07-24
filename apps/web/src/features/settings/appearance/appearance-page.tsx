import { LayoutConfig, SidebarConfig, ThemeConfig } from '@/components/appearance-settings'
import { SettingsPageHeader } from '@/features/settings/components/settings-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'

export function AppearancePage() {
  return (
    <SettingsShell>
      <SettingsPageHeader
        title="外观与界面偏好"
        description="自定义视觉主题、侧边栏形态与布局模式。"
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="space-y-8 p-6">
          <ThemeConfig size="lg" />
          <SidebarConfig size="lg" />
          <LayoutConfig size="lg" />
        </div>
      </section>
    </SettingsShell>
  )
}
