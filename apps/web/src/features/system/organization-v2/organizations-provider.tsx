import { createContext, useContext, useState } from 'react'

import type { Organization } from './type'

type OrganizationsContextType = {
  currentNode: Organization | null
  setCurrentNode: (node: Organization | null) => void
}

const OrganizationsContext = createContext<OrganizationsContextType | null>(null)
export function OrganizationsProvider({ children }: { children: React.ReactNode }) {
  const [currentNode, setCurrentNode] = useState<Organization | null>(null)

  return (
    <OrganizationsContext value={{ currentNode, setCurrentNode }}>{children}</OrganizationsContext>
  )
}

export const useOrganizations = () => {
  const organizationsContext = useContext(OrganizationsContext)
  if (!organizationsContext) {
    throw new Error('useOrganizations must be used within a OrganizationsProvider')
  }
  return organizationsContext
}
