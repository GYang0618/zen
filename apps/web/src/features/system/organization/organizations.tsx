import { getRouteApi } from '@tanstack/react-router'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { ListTree, Network, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { OrganizationGraph } from './components/organization-graph'
import { OrganizationTree } from './components/organization-tree'
import { OrganizationWorkspaceLayout } from './components/organization-workspace-layout'
import { OrganizationsDialogs } from './components/organizations-dialogs'
import { OrganizationsPrimaryButtons } from './components/organizations-primary-buttons'
import { OrganizationsProvider } from './organizations-provider'

const organizationRoute = getRouteApi('/_authenticated/system/_identity/organization')
const SEARCH_DEBOUNCE_MS = 300

export function Organizations() {
  const search = organizationRoute.useSearch()
  const navigate = organizationRoute.useNavigate()
  const view = search.view ?? 'graph'
  const [keyword, setKeyword] = useState(search.keyword ?? '')

  useEffect(() => {
    setKeyword(search.keyword ?? '')
  }, [search.keyword])

  useEffect(() => {
    const next = keyword.trim() || undefined
    if (next === (search.keyword || undefined)) return
    const timer = window.setTimeout(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          keyword: next
        })
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [keyword, navigate, search.keyword])

  return (
    <OrganizationsProvider keyword={search.keyword}>
      <AppHeader />

      <Main fixed className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<OrganizationsPrimaryButtons />} />

        <Tabs
          value={view}
          onValueChange={(next) => {
            const nextView = next === 'tree' ? 'tree' : 'graph'
            void navigate({
              search: (prev) => ({ ...prev, view: nextView === 'graph' ? undefined : nextView })
            })
          }}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <InputGroup className="max-w-sm min-w-56">
              <InputGroupInput
                placeholder="搜索组织名称或编码..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>

            <TabsList>
              <TabsTrigger value="graph" aria-label="拓扑图视图">
                <Network data-icon="inline-start" />
              </TabsTrigger>
              <TabsTrigger value="tree" aria-label="架构树视图">
                <ListTree data-icon="inline-start" />
              </TabsTrigger>
            </TabsList>
          </div>

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
