import type { z } from 'zod'
import type { permissionGroupSchema, permissionSchema } from './permission.schema'
import type {
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  roleDataScopeSchema,
  roleMemberSchema,
  roleMembersPageSchema,
  roleSchema,
  roleStatusSchema,
  rolesPageSchema,
  rolesQuerySchema,
  updateRoleSchema
} from './role.schema'

export type Permission = z.infer<typeof permissionSchema>
export type PermissionGroup = z.infer<typeof permissionGroupSchema>

export type RoleStatus = z.infer<typeof roleStatusSchema>
export type RoleDataScope = z.infer<typeof roleDataScopeSchema>
export type Role = z.infer<typeof roleSchema>
export type RoleMember = z.infer<typeof roleMemberSchema>
export type CreateRole = z.infer<typeof createRoleSchema>
export type UpdateRole = z.infer<typeof updateRoleSchema>
export type DeleteRoles = z.infer<typeof deleteRolesSchema>
export type AssignRolePermissions = z.infer<typeof assignRolePermissionsSchema>
export type AssignRoleMembers = z.infer<typeof assignRoleMembersSchema>
export type CloneRole = z.infer<typeof cloneRoleSchema>
export type RolesQuery = z.input<typeof rolesQuerySchema>
export type RolesPage = z.infer<typeof rolesPageSchema>
export type RoleMembersPage = z.infer<typeof roleMembersPageSchema>
