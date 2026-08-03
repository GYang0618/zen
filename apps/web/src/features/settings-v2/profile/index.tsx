import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

export function SettingsProfile() {
  return (
    <>
      <AppPageHeader
        title="个人资料"
        description="管理您的个人身份标识、展示名称、头像及公开联系方式。"
      />{' '}
      <Separator className="my-4 flex-none" />
      <div>Profile</div>
    </>
  )
}
