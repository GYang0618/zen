import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { OrganizationTree } from './components/organization-tree'
import { OrganizationsDialogs } from './components/organizations-dialogs'
import { OrganizationsPrimaryButtons } from './components/organizations-primary-buttons'
import { OrganizationsProvider } from './organizations-provider'

export function Organizations() {
  return (
    <OrganizationsProvider>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<OrganizationsPrimaryButtons />} />

        <OrganizationTree />
      </Main>

      <OrganizationsDialogs />
    </OrganizationsProvider>
  )
}
