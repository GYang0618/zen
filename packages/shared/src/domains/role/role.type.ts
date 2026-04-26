import type { z } from 'zod'
import type {
  roleDataScopeSchema,
  roleSchema,
  rolesPageSchema,
  rolesQuerySchema
} from './role.schema'

export type RoleDataScope = z.infer<typeof roleDataScopeSchema>
export type Role = z.infer<typeof roleSchema>
export type RolesQuery = z.input<typeof rolesQuerySchema>
export type RolesPage = z.infer<typeof rolesPageSchema>
