export {
  assignRolePermissionsSchema,
  createRoleSchema,
  deleteRolesSchema,
  rolesQuerySchema as findRolesQuerySchema,
  updateRoleSchema
} from '@zen/shared'

export type {
  AssignRolePermissions as AssignRolePermissionsDto,
  CreateRole as CreateRoleDto,
  DeleteRoles as DeleteRolesDto,
  RoleDataScope,
  RoleStatus,
  RolesQuery as FindRolesQueryDto,
  UpdateRole as UpdateRoleDto
} from '@zen/shared'
