export {
  assignRoleDataScopeSchema,
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  rolesQuerySchema as findRolesQuerySchema,
  updateRoleSchema
} from '@zen/shared'

export type {
  AssignRoleDataScope,
  AssignRoleMembers as AssignRoleMembersDto,
  AssignRolePermissions as AssignRolePermissionsDto,
  CloneRole as CloneRoleDto,
  CreateRole as CreateRoleDto,
  DeleteRoles as DeleteRolesDto,
  RoleDataScope,
  RoleEffectiveStatus,
  RoleStatus,
  RolesQuery as FindRolesQueryDto,
  UpdateRole as UpdateRoleDto
} from '@zen/shared'
