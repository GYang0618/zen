import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

export function SettingsNotifications() {
  return (
    <>
      <AppPageHeader title="通知与消息" description="自定义系统通知、消息提醒方式及频率。" />
      <Separator className="my-4 flex-none" />
      <div>SettingsNotifications</div>
    </>
  )
}
