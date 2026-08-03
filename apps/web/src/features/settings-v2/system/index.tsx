import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

export function SettingsSystem() {
  return (
    <>
      <AppPageHeader title="系统" description="管理你的系统设置、权限配置与数据备份恢复。" />
      <Separator className="my-4 flex-none" />
      <div>SettingsSystem</div>
    </>
  )
}
