import { useDialogState } from '@zen/ui'
import { createContext, useContext, useState } from 'react'

import { roles as initialRoles } from './data/mock'

import type { Role } from './type'

type RolesDialogType = 'add' | 'edit' | 'delete' | 'clone'

type RoleFormInput = {
  name: string
  code: string
  icon: Role['icon']
  iconColor: Role['iconColor']
  description: string
  expiredAt: string | null
}

/** 克隆角色的表单输入：仅复制权限配置，不复制关联成员 */
type RoleCloneInput = {
  name: string
  code: string
  description: string
  expiredAt: string | null
}

type RolesContextType = {
  open: RolesDialogType | null
  setOpen: (str: RolesDialogType | null) => void
  currentRow: Role | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>
  roles: Role[]
  addRole: (input: RoleFormInput) => Role
  updateRole: (id: string, input: Omit<RoleFormInput, 'code'>) => Role | undefined
  deleteRole: (id: string) => void
  activateRole: (id: string) => Role | undefined
  cloneRole: (id: string, input: RoleCloneInput) => Role | undefined
  hasRoleCode: (code: string, excludeId?: string) => boolean
}

const RolesContext = createContext<RolesContextType | null>(null)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<RolesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Role | null>(null)
  const [roles, setRoles] = useState<Role[]>(initialRoles)

  const hasRoleCode = (code: string, excludeId?: string) =>
    roles.some(
      (role) => role.id !== excludeId && role.code.toLowerCase() === code.trim().toLowerCase()
    )

  const addRole = (input: RoleFormInput): Role => {
    const now = new Date().toISOString()
    const nextRole: Role = {
      id: crypto.randomUUID(),
      name: input.name,
      code: input.code,
      icon: input.icon,
      iconColor: input.iconColor,
      description: input.description,
      permissions: [],
      memberCount: 0,
      latestMembers: [],
      status: 'active',
      expiredAt: input.expiredAt,
      createdAt: now,
      updatedAt: null,
      lockedAt: null
    }

    setRoles((prev) => [nextRole, ...prev])
    return nextRole
  }

  const updateRole = (id: string, input: Omit<RoleFormInput, 'code'>): Role | undefined => {
    const now = new Date().toISOString()
    let updated: Role | undefined

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== id) return role
        updated = {
          ...role,
          name: input.name,
          icon: input.icon,
          iconColor: input.iconColor,
          description: input.description,
          expiredAt: input.expiredAt,
          updatedAt: now
        }
        return updated
      })
    )

    return updated
  }

  const deleteRole = (id: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== id))
  }

  const activateRole = (id: string): Role | undefined => {
    const now = new Date().toISOString()
    let activated: Role | undefined

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== id || role.status !== 'inactive') return role
        activated = {
          ...role,
          status: 'active',
          updatedAt: now
        }
        return activated
      })
    )

    return activated
  }

  /** 克隆角色：复制来源角色的权限配置（含图标等展示信息），但不复制其关联成员 */
  const cloneRole = (id: string, input: RoleCloneInput): Role | undefined => {
    const source = roles.find((role) => role.id === id)
    if (!source) return undefined

    const now = new Date().toISOString()
    const cloned: Role = {
      id: crypto.randomUUID(),
      name: input.name,
      code: input.code,
      icon: source.icon,
      iconColor: source.iconColor,
      description: input.description,
      permissions: [...source.permissions],
      memberCount: 0,
      latestMembers: [],
      status: 'active',
      expiredAt: input.expiredAt,
      createdAt: now,
      updatedAt: null,
      lockedAt: null
    }

    setRoles((prev) => [cloned, ...prev])
    return cloned
  }

  return (
    <RolesContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        roles,
        addRole,
        updateRole,
        deleteRole,
        activateRole,
        cloneRole,
        hasRoleCode
      }}
    >
      {children}
    </RolesContext>
  )
}

export const useRoles = () => {
  const rolesContext = useContext(RolesContext)

  if (!rolesContext) {
    throw new Error('useRoles has to be used within <RolesContext>')
  }

  return rolesContext
}
