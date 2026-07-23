/** 默认租户编码（单租户交付阶段固定使用） */
export const DEFAULT_TENANT_CODE = 'default'

/** 默认租户稳定 ID（与 migration 种子一致） */
export const DEFAULT_TENANT_ID = 'cmtenant00000000000000001'

export type DataScope = 'all' | 'org_and_child' | 'org' | 'self' | 'custom'

export interface AuthContext {
  tenantId: string
  userId: string
  roles: string[]
  permissions: string[]
  dataScope: DataScope
  customOrgIds?: string[]
  primaryOrgId?: string
  primaryOrgPath?: string
  orgIds: string[]
  permVer: number
}
