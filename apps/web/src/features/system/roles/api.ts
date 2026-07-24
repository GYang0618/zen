import { request } from '@/lib/request'

import type {
  AssignRoleMembers,
  AssignRolePermissions,
  CloneRole,
  CreateRole,
  DeleteRoles,
  PermissionGroup,
  Role,
  RoleMember,
  RolesQuery,
  UpdateRole
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const roleApi = {
  getRoleList: (params?: RolesQuery) => request.get<PaginationResponse<Role>>('/role', { params }),

  getRoleById: (id: string) => request.get<Role>(`/role/${id}`),

  getPermissions: () => request.get<PermissionGroup[]>('/role/permissions'),

  createRole: (data: CreateRole) => request.post<Role, CreateRole>('/role', data),

  cloneRole: (id: string, data: CloneRole) =>
    request.post<Role, CloneRole>(`/role/${id}/clone`, data),

  updateRole: (id: string, data: UpdateRole) =>
    request.patch<Role, UpdateRole>(`/role/${id}`, data),

  assignPermissions: (id: string, data: AssignRolePermissions) =>
    request.patch<Role, AssignRolePermissions>(`/role/${id}/permissions`, data),

  getRoleMembers: (id: string, params?: { page?: number; pageSize?: number }) =>
    request.get<PaginationResponse<RoleMember>>(`/role/${id}/members`, { params }),

  addRoleMembers: (id: string, data: AssignRoleMembers) =>
    request.post<PaginationResponse<RoleMember>, AssignRoleMembers>(`/role/${id}/members`, data),

  removeRoleMember: (id: string, userId: string) =>
    request.delete<PaginationResponse<RoleMember>>(`/role/${id}/members/${userId}`),

  deleteRoles: (payload: DeleteRoles) =>
    request.delete<Role[], DeleteRoles>('/role', { data: payload })
}
