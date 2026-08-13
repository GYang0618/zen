export type RoleResponse = {
  id: string
  code: string
  name: string
  status: 'active' | 'disabled'
  effectiveStatus: 'active' | 'disabled' | 'expired' | 'locked'
  kind: 'system' | 'custom'
  dataScope: 'all' | 'org_and_child' | 'org' | 'self' | 'custom'
  customOrgIds: string[]
  icon: string | null
  iconColor: string | null
  expiresAt: string | null
  sort: number
  description: string | null
  memberCount: number
  permissionCount: number
  memberPreview: Array<{
    id: string
    nickname: string | null
    avatar: string | null
  }>
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

export type RoleMemberResponse = {
  id: string
  username: string
  nickname: string | null
  realName: string | null
  avatar: string | null
  email: string
  deptName: string | null
  boundAt: string
}

export type RoleMembersResponse = {
  items: RoleMemberResponse[]
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
  resource: string | null
  action: string | null
  description: string | null
  status: 'active' | 'deprecated'
  source: string | null
}

export type PermissionGroupResponse = {
  module: string
  permissions: PermissionResponse[]
}
