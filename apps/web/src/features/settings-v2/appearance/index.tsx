import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

export function SettingsAppearance() {
  return (
    <>
      <AppPageHeader
        title="外观界面"
        description="自定义系统的视觉主题模式 (日间/夜间/跟随系统)、侧边栏形态及界面布局。"
      />
      <Separator className="my-4 flex-none" />
      <div>Appearance</div>
    </>
  )
}
