import { jobProfilesPageSchema, userStatusSchema, usersPageSchema } from '@zen/shared'
import { z } from 'zod'

const compactRoleSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    status: z.string().optional(),
    icon: z.string().nullable().optional(),
    iconColor: z.string().nullable().optional()
  })
  .passthrough()

const compactOrganizationSchema = z
  .object({
    id: z.string().optional(),
    organizationId: z.string().optional(),
    organizationName: z.string().optional(),
    positionName: z.string().nullable().optional(),
    isPrimary: z.boolean().optional()
  })
  .passthrough()

export const compactUserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    nickname: z.string().nullable().optional(),
    realName: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    status: userStatusSchema,
    isLocked: z.boolean().optional(),
    lastActiveAt: z.string().nullable().optional(),
    roles: z.array(compactRoleSchema).optional(),
    organizations: z.array(compactOrganizationSchema).optional()
  })
  .passthrough()

export const paginationMetaSchema = z.object({
  total: z.number().optional(),
  totalPages: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
})

export const compactUsersPageSchema = z.object({
  items: z.array(compactUserSchema),
  pagination: paginationMetaSchema.optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
})

export const compactJobProfileSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    level: z.string().optional(),
    family: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    iconColor: z.string().nullable().optional(),
    status: z.string().optional(),
    organizationCount: z.number().optional(),
    totalHeadcount: z.number().optional(),
    activeCount: z.number().optional()
  })
  .passthrough()

export const compactJobProfilesPageSchema = z.object({
  items: z.array(compactJobProfileSchema),
  pagination: paginationMetaSchema.optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
})

export function unwrapToolData(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value
  if ('success' in value) {
    const result = value as { success?: unknown; data?: unknown }
    if (result.success === true && result.data !== undefined) {
      return result.data
    }
  }
  return value
}

export function parseUsersPageResult(result: unknown): { items: unknown[] } | undefined {
  if (!result) return undefined
  try {
    let raw: unknown = result
    if (typeof result === 'string') {
      try {
        raw = JSON.parse(result)
      } catch {
        return undefined
      }
    }
    const unwrapped = unwrapToolData(raw)
    const fullParsed = usersPageSchema.safeParse(unwrapped)
    if (fullParsed.success) return fullParsed.data
    const compactParsed = compactUsersPageSchema.safeParse(unwrapped)
    if (compactParsed.success) return compactParsed.data

    if (
      typeof unwrapped === 'object' &&
      unwrapped !== null &&
      'items' in unwrapped &&
      Array.isArray((unwrapped as { items: unknown }).items)
    ) {
      const items = (unwrapped as { items: unknown[] }).items
      const validItems = items.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'username' in item &&
          'email' in item
      )
      if (validItems.length > 0) {
        return { items: validItems }
      }
    }
    return undefined
  } catch {
    return undefined
  }
}

export function parseJobProfilesPageResult(result: unknown): { items: unknown[] } | undefined {
  if (!result) return undefined
  try {
    let raw: unknown = result
    if (typeof result === 'string') {
      try {
        raw = JSON.parse(result)
      } catch {
        return undefined
      }
    }
    const unwrapped = unwrapToolData(raw)
    const fullParsed = jobProfilesPageSchema.safeParse(unwrapped)
    if (fullParsed.success) return fullParsed.data

    const compactParsed = compactJobProfilesPageSchema.safeParse(unwrapped)
    if (compactParsed.success) return compactParsed.data

    if (
      typeof unwrapped === 'object' &&
      unwrapped !== null &&
      'items' in unwrapped &&
      Array.isArray((unwrapped as { items: unknown }).items)
    ) {
      const items = (unwrapped as { items: unknown[] }).items
      const validItems = items.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && 'id' in item && 'name' in item
      )
      if (validItems.length > 0) {
        return { items: validItems }
      }
    }
    return undefined
  } catch {
    return undefined
  }
}
