import { createContext, useContext } from 'react'

import type { OrganizationGraphRankdir } from '../build-organization-graph'

export type OrganizationGraphActions = {
  onToggleExpand: (id: string) => void
  rankdir: OrganizationGraphRankdir
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
