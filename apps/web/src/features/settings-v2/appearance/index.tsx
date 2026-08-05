import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

export function SettingsAppearance() {
  return (
    <>
      <AppPageHeader size="sm" />
      <Separator className="my-4 flex-none" />
      <div>Appearance</div>
    </>
  )
}
