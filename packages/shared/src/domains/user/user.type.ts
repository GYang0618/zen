import type { z } from 'zod'
import type {
  adminResetPasswordSchema,
  assignUserRolesResultSchema,
  assignUserRolesSchema,
  createUserSchema,
  deleteUsersSchema,
  replaceUserOrganizationsResultSchema,
  replaceUserOrganizationsSchema,
  updateUserResultSchema,
  updateUserSchema,
  updateUsersStatusSchema,
  userGenderSchema,
  userMfaTypeSchema,
  userOrganizationMembershipSchema,
  userRolePreviewSchema,
  userSchema,
  userStatusSchema,
  usersPageSchema,
  usersQuerySchema,
  usersSortBySchema,
  usersSortOrderSchema
} from './user.schema'

export type UserStatus = z.infer<typeof userStatusSchema>
export type UserGender = z.infer<typeof userGenderSchema>
export type UserMfaType = z.infer<typeof userMfaTypeSchema>
export type UserRolePreview = z.infer<typeof userRolePreviewSchema>
export type UserOrganizationMembership = z.infer<typeof userOrganizationMembershipSchema>
export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type UpdateUserResult = z.infer<typeof updateUserResultSchema>
export type AdminResetPassword = z.infer<typeof adminResetPasswordSchema>
export type DeleteUsers = z.infer<typeof deleteUsersSchema>
export type UpdateUsersStatus = z.infer<typeof updateUsersStatusSchema>
export type AssignUserRoles = z.infer<typeof assignUserRolesSchema>
export type AssignUserRolesResult = z.infer<typeof assignUserRolesResultSchema>
export type ReplaceUserOrganizations = z.infer<typeof replaceUserOrganizationsSchema>
export type ReplaceUserOrganizationsResult = z.infer<typeof replaceUserOrganizationsResultSchema>
export type UsersQuery = z.input<typeof usersQuerySchema>
export type UsersPage = z.infer<typeof usersPageSchema>
export type UsersSortBy = z.infer<typeof usersSortBySchema>
export type UsersSortOrder = z.infer<typeof usersSortOrderSchema>
