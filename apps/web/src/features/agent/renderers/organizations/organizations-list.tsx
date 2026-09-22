import { ListTree, Network } from 'lucide-react'
import { useMemo } from 'react'

import {
  OrganizationGraph,
  OrganizationsDialogs,
  OrganizationsProvider,
  OrganizationTree,
  OrganizationWorkspaceLayout
} from '@/features/system/organization'

import { ViewSwitcher } from '../../generative-ui/components/view-switcher'

import type { Organization } from '@/features/system/organization/type'

export interface OrganizationsListViewProps {
  title: string
  treeData?: Organization[]
  description?: string
  keyword?: string
  loading?: boolean
}

export function OrganizationsList({
  title,
  description,
  treeData,
  keyword,
  loading = false
}: OrganizationsListViewProps) {
  const views = useMemo(
    () => [
      {
        key: 'graph',
        icon: Network,
        render: (
          <div className="h-[460px] w-full min-h-[400px]">
            <OrganizationWorkspaceLayout className="h-full">
              <OrganizationGraph className="border-none bg-transparent py-0 shadow-none" />
            </OrganizationWorkspaceLayout>
          </div>
        )
      },
      {
        key: 'tree',
        icon: ListTree,
        render: (
          <div className="h-[460px] w-full min-h-[400px]">
            <OrganizationWorkspaceLayout className="h-full">
              <OrganizationTree className="border-none bg-transparent py-0 shadow-none" />
            </OrganizationWorkspaceLayout>
          </div>
        )
      }
    ],
    []
  )

  return (
    <OrganizationsProvider keyword={keyword} initialData={treeData}>
      <OrganizationsDialogs />
      <ViewSwitcher
        title={title ?? '组织架构查询结果'}
        description={description}
        views={views}
        loading={loading}
      />
    </OrganizationsProvider>
  )
}
