import type { Paged, PageQueryInput } from '../pagination'
import type { UserStatus } from '../user'

export type RoleDataScope = 'all' | 'department' | 'self' | 'custom'

export type Role = {
  id: string
  name: string
  code: string
  status: UserStatus
  dataScope: RoleDataScope
  sort: number
  description: string | null
  memberCount: number
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export type RolesQuery = PageQueryInput & {
  keyword?: string
  status?: UserStatus | UserStatus[]
  dataScope?: RoleDataScope | RoleDataScope[]
}

export type RolesPage = Paged<Role>
