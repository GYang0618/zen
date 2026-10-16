import type { z } from 'zod'
import type {
  assignRoleDataScopeSchema,
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  roleDataScopeSchema,
  roleEffectiveStatusSchema,
  roleIconColorSchema,
  roleIconSchema,
  roleKindSchema,
  roleListItemSchema,
  roleMemberPreviewSchema,
  roleMemberSchema,
  roleMembersPageSchema,
  roleSchema,
  roleStatisticsSchema,
  roleStatisticsToolSchema,
  roleStatusSchema,
  rolesPageSchema,
  rolesQuerySchema,
  updateRoleSchema
} from './role.schema.js'

export type RoleStatus = z.infer<typeof roleStatusSchema>
export type RoleEffectiveStatus = z.infer<typeof roleEffectiveStatusSchema>
export type RoleKind = z.infer<typeof roleKindSchema>
export type RoleDataScope = z.infer<typeof roleDataScopeSchema>
export type RoleIcon = z.infer<typeof roleIconSchema>
export type RoleIconColor = z.infer<typeof roleIconColorSchema>
export type Role = z.infer<typeof roleSchema>
export type RoleListItem = z.infer<typeof roleListItemSchema>
export type RoleMember = z.infer<typeof roleMemberSchema>
export type RoleMemberPreview = z.infer<typeof roleMemberPreviewSchema>
export type CreateRole = z.infer<typeof createRoleSchema>
export type UpdateRole = z.infer<typeof updateRoleSchema>
export type DeleteRoles = z.infer<typeof deleteRolesSchema>
export type AssignRolePermissions = z.infer<typeof assignRolePermissionsSchema>
export type AssignRoleDataScope = z.infer<typeof assignRoleDataScopeSchema>
export type AssignRoleMembers = z.infer<typeof assignRoleMembersSchema>
export type CloneRole = z.infer<typeof cloneRoleSchema>
export type RolesQuery = z.input<typeof rolesQuerySchema>
export type RolesPage = z.infer<typeof rolesPageSchema>
export type RoleMembersPage = z.infer<typeof roleMembersPageSchema>
export type RoleStatisticsResponse = z.infer<typeof roleStatisticsSchema>
export type RoleStatisticsTool = z.input<typeof roleStatisticsToolSchema>
