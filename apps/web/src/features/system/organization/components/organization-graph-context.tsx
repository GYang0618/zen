import { createContext, useContext } from 'react'

import type { ReactNode } from 'react'
import type { OrganizationGraphRankdir } from '../build-organization-graph'
import type { Organization } from '../type'

export type OrganizationGraphActions = {
  onToggleExpand: (id: string) => void
  rankdir: OrganizationGraphRankdir
  onDelete?: (org: Organization) => void
  onMerge?: (org: Organization) => void
  /** 替换节点上的默认菜单。不传时使用配置、合并、删除。 */
  renderMenu?: (organization: Organization) => ReactNode
}

const OrganizationGraphActionsContext = createContext<OrganizationGraphActions | null>(null)

export function OrganizationGraphActionsProvider({
  value,
  children
}: {
  value: OrganizationGraphActions
  children: React.ReactNode
}) {
  return <OrganizationGraphActionsContext value={value}>{children}</OrganizationGraphActionsContext>
}

export function useOrganizationGraphActions() {
  const context = useContext(OrganizationGraphActionsContext)
  if (!context) {
    throw new Error(
      'useOrganizationGraphActions must be used within OrganizationGraphActionsProvider'
    )
  }
  return context
}
