import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

import { OrganizationsPrimaryButtons } from './components/organizations-primary-buttons'
import { OrganizationsView } from './components/organizations-view'
import { OrganizationsProvider } from './organizations-provider'

export function Organizations() {
  return (
    <OrganizationsProvider>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="组织架构"
          description="企业组织架构管理，管理分公司、部门、业务中心、岗位等"
          actions={<OrganizationsPrimaryButtons />}
        />
        <OrganizationsView />
      </Main>
    </OrganizationsProvider>
  )
}
