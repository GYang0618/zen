import type { AuthContext, DataScope } from '@zen/shared'

export type DataScopeFieldMap = {
  orgIdField?: string
  orgPathField?: string
  ownerField?: string
}

/**
 * 将 AuthContext.dataScope 转为 Prisma where 片段（需与业务 where 做 AND 合并）。
 */
export function applyDataScope(
  auth: Pick<AuthContext, 'userId' | 'dataScope' | 'orgIds' | 'primaryOrgPath' | 'customOrgIds'>,
  fields: DataScopeFieldMap = {}
): Record<string, unknown> {
  const orgIdField = fields.orgIdField ?? 'organizationId'
  const orgPathField = fields.orgPathField ?? 'organizationPath'
  const ownerField = fields.ownerField ?? 'createdBy'

  return buildScopeWhere(auth.dataScope, auth, { orgIdField, orgPathField, ownerField })
}

function buildScopeWhere(
  scope: DataScope,
  auth: Pick<AuthContext, 'userId' | 'orgIds' | 'primaryOrgPath' | 'customOrgIds'>,
  fields: Required<DataScopeFieldMap>
): Record<string, unknown> {
  switch (scope) {
    case 'all':
      return {}
    case 'self':
      return { [fields.ownerField]: auth.userId }
    case 'org':
      return {
        [fields.orgIdField]: {
          in: auth.orgIds.length > 0 ? auth.orgIds : ['__none__']
        }
      }
    case 'org_and_child': {
      const prefix = auth.primaryOrgPath
      if (!prefix) {
        return {
          [fields.orgIdField]: {
            in: auth.orgIds.length > 0 ? auth.orgIds : ['__none__']
          }
        }
      }
      return {
        [fields.orgPathField]: { startsWith: prefix }
      }
    }
    case 'custom':
      return {
        [fields.orgIdField]: {
          in: auth.customOrgIds && auth.customOrgIds.length > 0 ? auth.customOrgIds : ['__none__']
        }
      }
    default:
      return { [fields.ownerField]: auth.userId }
  }
}

export function applyUserListDataScope(
  auth: Pick<AuthContext, 'userId' | 'dataScope' | 'orgIds' | 'primaryOrgPath' | 'customOrgIds'>
): Record<string, unknown> {
  switch (auth.dataScope) {
    case 'all':
      return {}
    case 'self':
      return { id: auth.userId }
    case 'org':
      return {
        organizations: {
          some: {
            leftAt: null,
            organizationId: { in: nonemptyIds(auth.orgIds) }
          }
        }
      }
    case 'org_and_child': {
      if (auth.primaryOrgPath) {
        return {
          organizations: {
            some: {
              leftAt: null,
              organization: { path: { startsWith: auth.primaryOrgPath } }
            }
          }
        }
      }
      return {
        organizations: {
          some: {
            leftAt: null,
            organizationId: { in: nonemptyIds(auth.orgIds) }
          }
        }
      }
    }
    case 'custom':
      return {
        organizations: {
          some: {
            leftAt: null,
            organizationId: { in: nonemptyIds(auth.customOrgIds) }
          }
        }
      }
    default:
      return { id: auth.userId }
  }
}

export function applyOrganizationTreeDataScope(
  auth: Pick<AuthContext, 'dataScope' | 'orgIds' | 'primaryOrgPath' | 'customOrgIds'>
): Record<string, unknown> {
  switch (auth.dataScope) {
    case 'all':
      return {}
    case 'self':
    case 'org':
      return { id: { in: nonemptyIds(auth.orgIds) } }
    case 'org_and_child':
      if (auth.primaryOrgPath) {
        return { path: { startsWith: auth.primaryOrgPath } }
      }
      return { id: { in: nonemptyIds(auth.orgIds) } }
    case 'custom':
      return { id: { in: nonemptyIds(auth.customOrgIds) } }
    default:
      return { id: { in: nonemptyIds(auth.orgIds) } }
  }
}

/**
 * 带 organization 关联的资源（如 DemoNote）在 org_and_child 下按组织 path 过滤。
 */
export function applyOrgScopedResourceDataScope(
  auth: Pick<AuthContext, 'userId' | 'dataScope' | 'orgIds' | 'primaryOrgPath' | 'customOrgIds'>
): Record<string, unknown> {
  switch (auth.dataScope) {
    case 'all':
      return {}
    case 'self':
      return { createdBy: auth.userId }
    case 'org':
      return { organizationId: { in: nonemptyIds(auth.orgIds) } }
    case 'org_and_child':
      if (auth.primaryOrgPath) {
        return { organization: { path: { startsWith: auth.primaryOrgPath } } }
      }
      return { organizationId: { in: nonemptyIds(auth.orgIds) } }
    case 'custom':
      return { organizationId: { in: nonemptyIds(auth.customOrgIds) } }
    default:
      return { createdBy: auth.userId }
  }
}

function nonemptyIds(ids: string[] | undefined): string[] {
  return ids && ids.length > 0 ? ids : ['__none__']
}
