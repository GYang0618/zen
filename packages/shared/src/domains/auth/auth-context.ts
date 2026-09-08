import { z } from 'zod'

import { dataScopeSchema, idSchema } from '../../primitives/index.js'

/** 默认租户编码（单租户交付阶段固定使用） */
export const DEFAULT_TENANT_CODE = 'default'

/** 默认租户稳定 ID（与 migration 种子一致） */
export const DEFAULT_TENANT_ID = 'cmtenant00000000000000001'

export const authContextSchema = z.object({
  tenantId: idSchema,
  userId: idSchema,
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  isAdmin: z.boolean(),
  dataScope: dataScopeSchema,
  customOrgIds: z.array(idSchema).optional(),
  primaryOrgId: idSchema.optional(),
  primaryOrgPath: z.string().optional(),
  orgIds: z.array(idSchema),
  permVer: z.number().int().nonnegative()
})

export type AuthContext = z.infer<typeof authContextSchema>
export type { DataScope } from '../../primitives/index.js'
