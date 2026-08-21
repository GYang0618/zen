import { useDialogState } from '@zen/ui'
import { createContext, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  useChangeOrganizationParent,
  useCreateOrganization,
  useOrganizationTree,
  useUpdateOrganization,
  useUpdateOrganizationLeader
} from './queries'
import { findOrganization, flattenOrganizations, validateOrganizationDrop } from './utils'

import type { OrganizationType, Organization as SharedOrganization } from '@zen/shared'
import type { Organization } from './type'

export type OrganizationsDialogType = 'add' | 'edit' | 'edit-leader' | 'type-catalog'

export type OrganizationBasicInput = {
  name: string
  code: string
  type: OrganizationType
  description: string
  effectiveDate: string
  parentId: string | null
  leaderId?: string | null
}

type OrganizationsContextType = {
  open: OrganizationsDialogType | null
  setOpen: (str: OrganizationsDialogType | null) => void
  currentNode: Organization | null
  setCurrentNode: (node: Organization | null) => void
  organizations: Organization[]
  rootOrganization: Organization | undefined
  isLoading: boolean
  addOrganization: (input: OrganizationBasicInput) => Promise<SharedOrganization>
  updateOrganization: (
    id: string,
    input: Omit<OrganizationBasicInput, 'code' | 'leaderId'> & { code?: string }
  ) => Promise<SharedOrganization | undefined>
  updateOrganizationLeader: (id: string, leaderId: string | null) => Promise<SharedOrganization>
  moveOrganization: (activeId: string, overId: string) => Promise<boolean>
  hasOrganizationCode: (code: string, excludeId?: string) => boolean
  getParentOptions: (excludeId?: string) => Organization[]
}

const OrganizationsContext = createContext<OrganizationsContextType | null>(null)

export function OrganizationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<OrganizationsDialogType>(null)
  const [currentNode, setCurrentNode] = useState<Organization | null>(null)

  const { data: organizations = [], isLoading } = useOrganizationTree()
  const createOrganization = useCreateOrganization()
  const updateOrganizationMutation = useUpdateOrganization()
  const updateLeaderMutation = useUpdateOrganizationLeader()
  const changeParentMutation = useChangeOrganizationParent()

  const rootOrganization = organizations[0]

  const resolvedCurrentNode = useMemo(() => {
    if (!currentNode) return null
    return findOrganization(organizations, currentNode.id) ?? null
  }, [currentNode, organizations])

  const hasOrganizationCode = (code: string, excludeId?: string) =>
    flattenOrganizations(organizations).some(
      (org) => org.id !== excludeId && org.code.toLowerCase() === code.trim().toLowerCase()
    )

  const getParentOptions = (excludeId?: string) => {
    const flat = flattenOrganizations(organizations)
    if (!excludeId) return flat
    const excluded = new Set<string>()
    const collect = (node: Organization) => {
      excluded.add(node.id)
      node.children?.forEach(collect)
    }
    const target = findOrganization(organizations, excludeId)
    if (target) collect(target)
    return flat.filter((org) => !excluded.has(org.id))
  }

  const addOrganization = async (input: OrganizationBasicInput) => {
    return createOrganization.mutateAsync({
      name: input.name,
      code: input.code,
      type: input.type,
      parentId: input.parentId,
      description: input.description || undefined,
      effectiveDate: input.effectiveDate,
      leaderId: input.leaderId ?? null
    })
  }

  const updateOrganization = async (
    id: string,
    input: Omit<OrganizationBasicInput, 'code' | 'leaderId'> & { code?: string }
  ) => {
    const current = findOrganization(organizations, id)
    if (!current) return undefined

    const nextParentId = input.parentId
    const parentChanged = (nextParentId ?? null) !== (current.parentId ?? null)

    if (parentChanged) {
      await changeParentMutation.mutateAsync({
        id,
        data: { parentId: nextParentId }
      })
    }

    return updateOrganizationMutation.mutateAsync({
      id,
      data: {
        name: input.name,
        type: input.type,
        description: input.description || null,
        effectiveDate: input.effectiveDate
      }
    })
  }

  const moveOrganization = async (activeId: string, overId: string): Promise<boolean> => {
    const validation = validateOrganizationDrop(organizations, activeId, overId)
    if (!validation.isValid) return false

    try {
      await changeParentMutation.mutateAsync({
        id: activeId,
        data: { parentId: validation.destinationParentId }
      })
      toast.success('组织已移动')
      return true
    } catch {
      return false
    }
  }

  const updateOrganizationLeader = async (id: string, leaderId: string | null) => {
    return updateLeaderMutation.mutateAsync({ id, data: { leaderId } })
  }

  return (
    <OrganizationsContext
      value={{
        open,
        setOpen,
        currentNode: resolvedCurrentNode,
        setCurrentNode,
        organizations,
        rootOrganization,
        isLoading,
        addOrganization,
        updateOrganization,
        updateOrganizationLeader,
        moveOrganization,
        hasOrganizationCode,
        getParentOptions
      }}
    >
      {children}
    </OrganizationsContext>
  )
}

export const useOrganizations = () => {
  const organizationsContext = useContext(OrganizationsContext)
  if (!organizationsContext) {
    throw new Error('useOrganizations must be used within a OrganizationsProvider')
  }
  return organizationsContext
}
