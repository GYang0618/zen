import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { OrganizationTree } from './components/organization-tree'
import { OrganizationsPrimaryButtons } from './components/organizations-primary-buttons'
import { organizations } from './data/mock'
import { OrganizationsProvider } from './organizations-provider'

export function Organizations() {
  return (
    <OrganizationsProvider>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader
          title="组织架构"
          description="企业组织架构管理，管理分公司、部门、业务中心、岗位等"
          actions={<OrganizationsPrimaryButtons />}
        />

        <OrganizationTree data={organizations} />
      </Main>
    </OrganizationsProvider>
  )
}
