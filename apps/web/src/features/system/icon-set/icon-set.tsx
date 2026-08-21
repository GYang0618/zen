import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { LucideIconsBrowser } from './components/lucide-icons-browser'

export function IconSetPage() {
  return (
    <>
      <AppHeader />

      <Main fixed className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader />
        <LucideIconsBrowser />
      </Main>
    </>
  )
}
