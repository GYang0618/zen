import type { z } from 'zod'
import type {
  createUserSchema,
  usersSortBySchema,
  usersSortOrderSchema,
  updateUserSchema,
  userSchema,
  userStatusSchema,
  usersPageSchema,
  usersQuerySchema
} from '../schemas/users'

export type UserStatus = z.infer<typeof userStatusSchema>
export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type UsersQuery = z.input<typeof usersQuerySchema>
export type UsersPage = z.infer<typeof usersPageSchema>
export type UsersSortBy = z.infer<typeof usersSortBySchema>
export type UsersSortOrder = z.infer<typeof usersSortOrderSchema>
