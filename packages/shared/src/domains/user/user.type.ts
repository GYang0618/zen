import type { z } from 'zod'
import type {
  createUserSchema,
  deleteUsersSchema,
  updateUserSchema,
  updateUsersStatusSchema,
  userSchema,
  userStatusSchema,
  usersPageSchema,
  usersQuerySchema,
  usersSortBySchema,
  usersSortOrderSchema
} from './user.schema'

export type UserStatus = z.infer<typeof userStatusSchema>
export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type DeleteUsers = z.infer<typeof deleteUsersSchema>

export type UpdateUsersStatus = z.infer<typeof updateUsersStatusSchema>
export type UsersQuery = z.input<typeof usersQuerySchema>
export type UsersPage = z.infer<typeof usersPageSchema>
export type UsersSortBy = z.infer<typeof usersSortBySchema>
export type UsersSortOrder = z.infer<typeof usersSortOrderSchema>
