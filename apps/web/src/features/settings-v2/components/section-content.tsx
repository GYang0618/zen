import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

import type { ReactNode } from 'react'

export function SectionContent({ children }: { children: ReactNode }) {
  return (
    <section className="flex-1">
      <AppPageHeader size="sm" />
      <Separator className="my-4 flex-none" />
      {children}
    </section>
  )
}
