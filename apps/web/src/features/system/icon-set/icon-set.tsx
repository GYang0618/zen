import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { LucideIconsBrowser } from './components/lucide-icons-browser'

export function IconSetPage() {
  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader />
        <LucideIconsBrowser />
      </Main>
    </>
  )
}
