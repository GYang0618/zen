import { ListTree, Network } from 'lucide-react'
import { useMemo } from 'react'

import { OrganizationGraph, OrganizationTree } from '@/features/system/organization'

import { ViewSwitcher } from '../../generative-ui/components/view-switcher'
import { OrganizationAgentMenu, OrganizationAgentTreeActions } from './organization-menu'

import type { OrganizationTreeNode } from '@zen/shared'

export interface OrganizationsListViewProps {
  title: string
  treeData?: OrganizationTreeNode[]
  description?: string
  loading?: boolean
}

export function OrganizationsList({
  title,
  description,
  treeData = [],
  loading = false
}: OrganizationsListViewProps) {
  const views = useMemo(
    () => [
      {
        key: 'graph',
        icon: Network,
        render: (
          <OrganizationGraph
            className="h-96"
            organizations={treeData}
            renderMenu={(organization) => (
              <OrganizationAgentMenu organization={organization} isolatePointer />
            )}
          />
        )
      },
      {
        key: 'tree',
        icon: ListTree,
        render: (
          <OrganizationTree
            className="h-96"
            organizations={treeData}
            renderActions={(organization) => (
              <OrganizationAgentTreeActions organization={organization} />
            )}
          />
        )
      }
    ],
    [treeData]
  )

  return (
    <ViewSwitcher
      title={title ?? '组织架构查询结果'}
      description={description}
      views={views}
      loading={loading}
    />
  )
}
