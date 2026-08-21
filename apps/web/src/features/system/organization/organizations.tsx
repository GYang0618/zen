import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { ListTree, Network } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { OrganizationGraph } from './components/organization-graph'
import { OrganizationTree } from './components/organization-tree'
import { OrganizationWorkspaceLayout } from './components/organization-workspace-layout'
import { OrganizationsDialogs } from './components/organizations-dialogs'
import { OrganizationsPrimaryButtons } from './components/organizations-primary-buttons'
import { OrganizationsProvider } from './organizations-provider'

export function Organizations() {
  return (
    <OrganizationsProvider>
      <AppHeader />

      <Main fixed className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<OrganizationsPrimaryButtons />} />

        <Tabs defaultValue="tree" className="flex min-h-0 flex-1 flex-col">
          <TabsList>
            <TabsTrigger value="tree">
              <ListTree data-icon="inline-start" />
              列表
            </TabsTrigger>
            <TabsTrigger value="graph">
              <Network data-icon="inline-start" />
              图谱
            </TabsTrigger>
          </TabsList>

          <OrganizationWorkspaceLayout>
            <TabsContent value="tree" className="mt-0 flex h-full min-h-0 flex-col">
              <OrganizationTree />
            </TabsContent>
            <TabsContent value="graph" className="mt-0 flex h-full min-h-0 flex-col">
              <OrganizationGraph />
            </TabsContent>
          </OrganizationWorkspaceLayout>
        </Tabs>
      </Main>

      <OrganizationsDialogs />
    </OrganizationsProvider>
  )
}
