import { request } from '@/lib/request'

import type {
  AssignRolePermissions,
  CreateRole,
  DeleteRoles,
  PermissionGroup,
  Role,
  RolesQuery,
  UpdateRole
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const roleApi = {
  getRoleList: (params?: RolesQuery) => request.get<PaginationResponse<Role>>('/role', { params }),

  getRoleById: (id: string) => request.get<Role>(`/role/${id}`),

  getPermissions: () => request.get<PermissionGroup[]>('/role/permissions'),

  createRole: (data: CreateRole) => request.post<Role, CreateRole>('/role', data),

  updateRole: (id: string, data: UpdateRole) =>
    request.patch<Role, UpdateRole>(`/role/${id}`, data),

  assignPermissions: (id: string, data: AssignRolePermissions) =>
    request.patch<Role, AssignRolePermissions>(`/role/${id}/permissions`, data),

  deleteRoles: (payload: DeleteRoles) =>
    request.delete<Role[], DeleteRoles>('/role', { data: payload })
}
