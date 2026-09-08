import { z } from 'zod'

export const idSchema = z.string().trim().min(1).max(128)
export const timestampSchema = z.iso.datetime()
export const permissionCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/)
export const sortOrderSchema = z.enum(['asc', 'desc'])
export const dataScopeSchema = z.enum(['all', 'org_and_child', 'org', 'self', 'custom'])

export type EntityId = z.infer<typeof idSchema>
export type DataScope = z.infer<typeof dataScopeSchema>
