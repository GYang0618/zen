import type { z } from 'zod'
import type { permissionGroupSchema, permissionSchema } from './permission.schema'
import type {
  assignRolePermissionsSchema,
  createRoleSchema,
  deleteRolesSchema,
  roleDataScopeSchema,
  roleSchema,
  roleStatusSchema,
  rolesPageSchema,
  rolesQuerySchema,
  updateRoleSchema
} from './role.schema'

export type RoleStatus = z.infer<typeof roleStatusSchema>
export type RoleDataScope = z.infer<typeof roleDataScopeSchema>
export type Role = z.infer<typeof roleSchema>
export type CreateRole = z.infer<typeof createRoleSchema>
export type UpdateRole = z.infer<typeof updateRoleSchema>
export type DeleteRoles = z.infer<typeof deleteRolesSchema>
export type AssignRolePermissions = z.infer<typeof assignRolePermissionsSchema>
export type RolesQuery = z.input<typeof rolesQuerySchema>
export type RolesPage = z.infer<typeof rolesPageSchema>

export type Permission = z.infer<typeof permissionSchema>
export type PermissionGroup = z.infer<typeof permissionGroupSchema>
