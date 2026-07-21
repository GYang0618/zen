export type RoleResponse = {
  id: string
  code: string
  name: string
  status: 'active' | 'disabled'
  dataScope: 'all' | 'department' | 'self' | 'custom'
  sort: number
  description: string | null
  memberCount: number
  permissions: string[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export type RoleListItemResponse = RoleResponse

export type RoleListResponse = {
  items: RoleListItemResponse[]
  pagination: {
    total: number
    totalPages: number
    page: number
    pageSize: number
  }
}

export type PermissionResponse = {
  id: string
  code: string
  name: string
  module: string | null
  description: string | null
}

export type PermissionGroupResponse = {
  module: string
  permissions: PermissionResponse[]
}
