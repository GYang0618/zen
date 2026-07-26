import { LayoutConfig, SidebarConfig, ThemeConfig } from '@/components/appearance-settings'
import { SettingsPageHeader } from '@/features/settings/components/settings-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'

export function AppearancePage() {
  return (
    <SettingsShell>
      <SettingsPageHeader
        title="外观偏好"
        description="自定义系统的视觉主题模式 (日间/夜间/跟随系统)、侧边栏形态及界面布局。"
      />

      <div className="space-y-8">
        <ThemeConfig size="lg" />
        <SidebarConfig size="lg" />
        <LayoutConfig size="lg" />
      </div>
    </SettingsShell>
  )
}

