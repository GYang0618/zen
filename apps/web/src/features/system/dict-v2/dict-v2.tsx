import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { DictPrimaryButtons } from './components/dict-primary-buttons'

export function Dict() {
  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<DictPrimaryButtons />} />
      </Main>
    </>
  )
}
