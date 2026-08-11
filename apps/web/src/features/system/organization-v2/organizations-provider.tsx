import { useDialogState } from '@zen/ui'
import { createContext, useContext, useState } from 'react'

import { organizations as initialOrganizations } from './data/mock'
import {
  findOrganization,
  flattenOrganizations,
  insertOrganizationChild,
  removeOrganizationFromTree,
  updateOrganizationInTree
} from './utils'

import type { Organization, OrganizationLeader } from './type'

export type OrganizationsDialogType = 'add' | 'edit' | 'edit-leader'

export type OrganizationBasicInput = {
  name: string
  code: string
  type: string
  description: string
  effectiveDate: string
  parentId: string
  leader?: OrganizationLeader
}

type OrganizationsContextType = {
  open: OrganizationsDialogType | null
  setOpen: (str: OrganizationsDialogType | null) => void
  currentNode: Organization | null
  setCurrentNode: (node: Organization | null) => void
  organizations: Organization[]
  rootOrganization: Organization | undefined
  addOrganization: (input: OrganizationBasicInput) => Organization
  updateOrganization: (
    id: string,
    input: Omit<OrganizationBasicInput, 'code'> & { code?: string }
  ) => Organization | undefined
  updateOrganizationLeader: (id: string, leader: OrganizationLeader) => Organization | undefined
  hasOrganizationCode: (code: string, excludeId?: string) => boolean
  getParentOptions: (excludeId?: string) => Organization[]
}

const OrganizationsContext = createContext<OrganizationsContextType | null>(null)

export function OrganizationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<OrganizationsDialogType>(null)
  const [currentNode, setCurrentNode] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)

  const rootOrganization = organizations[0]

  const refreshCurrentNode = (nextTree: Organization[], preferredId?: string) => {
    const targetId = preferredId ?? currentNode?.id
    if (!targetId) {
      setCurrentNode(null)
      return
    }
    setCurrentNode(findOrganization(nextTree, targetId) ?? null)
  }

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

  const addOrganization = (input: OrganizationBasicInput): Organization => {
    const parent = findOrganization(organizations, input.parentId) ?? rootOrganization
    const next: Organization = {
      id: crypto.randomUUID(),
      name: input.name,
      code: input.code,
      type: input.type,
      description: input.description,
      effectiveDate: input.effectiveDate,
      parentId: parent?.id,
      memberCount: 0,
      positionCount: 0,
      budget: 0,
      leader: input.leader,
      children: []
    }

    if (!parent) {
      const tree = [...organizations, next]
      setOrganizations(tree)
      return next
    }

    const tree = insertOrganizationChild(organizations, parent.id, next)
    setOrganizations(tree)
    return next
  }

  const updateOrganization = (
    id: string,
    input: Omit<OrganizationBasicInput, 'code'> & { code?: string }
  ): Organization | undefined => {
    const current = findOrganization(organizations, id)
    if (!current) return undefined

    const nextParentId = input.parentId
    const parentChanged = nextParentId !== (current.parentId ?? '')

    let nextTree: Organization[]
    let updated: Organization

    if (parentChanged && nextParentId) {
      const { tree, removed } = removeOrganizationFromTree(organizations, id)
      if (!removed) return undefined
      updated = {
        ...removed,
        name: input.name,
        type: input.type,
        description: input.description,
        effectiveDate: input.effectiveDate,
        parentId: nextParentId,
        leader: input.leader ?? removed.leader
      }
      nextTree = insertOrganizationChild(tree, nextParentId, updated)
    } else {
      nextTree = updateOrganizationInTree(organizations, id, (node) => {
        updated = {
          ...node,
          name: input.name,
          type: input.type,
          description: input.description,
          effectiveDate: input.effectiveDate,
          leader: input.leader ?? node.leader
        }
        return updated
      })
    }

    setOrganizations(nextTree)
    refreshCurrentNode(nextTree, id)
    return updated!
  }

  const updateOrganizationLeader = (
    id: string,
    leader: OrganizationLeader
  ): Organization | undefined => {
    let updated: Organization | undefined
    const nextTree = updateOrganizationInTree(organizations, id, (node) => {
      updated = { ...node, leader }
      return updated
    })
    setOrganizations(nextTree)
    refreshCurrentNode(nextTree, id)
    return updated
  }

  return (
    <OrganizationsContext
      value={{
        open,
        setOpen,
        currentNode,
        setCurrentNode,
        organizations,
        rootOrganization,
        addOrganization,
        updateOrganization,
        updateOrganizationLeader,
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
