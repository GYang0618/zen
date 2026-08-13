import {
  Building,
  Building2,
  Component,
  FolderTree,
  Network,
  UserCircle,
  Users
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type { OrganizationType } from '@zen/shared'

export const ORG_TYPES = {
  GROUP: 'group',
  COMPANY: 'company',
  BRANCH: 'branch',
  CENTER: 'center',
  DEPARTMENT: 'department',
  TEAM: 'team'
} as const satisfies Record<string, OrganizationType>

export type OrgType = (typeof ORG_TYPES)[keyof typeof ORG_TYPES]

/** 未选择上级组织时（新建为根节点）允许创建的组织类型 */
export const ROOT_ORGANIZATION_TYPES: OrgType[] = [
  ORG_TYPES.GROUP,
  ORG_TYPES.COMPANY,
  ORG_TYPES.CENTER
]

export const organizationTypeLabels: Record<string, string> = {
  group: '集团',
  company: '公司',
  branch: '分公司',
  center: '中心',
  department: '部门',
  team: '小组',
  GROUP: '集团',
  COMPANY: '公司',
  BRANCH: '分公司',
  CENTER: '中心',
  DEPARTMENT: '部门',
  TEAM: '小组'
}

export const organizationIconConfig: Record<string, { icon: LucideIcon; defaultColor: string }> = {
  group: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  company: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  branch: { icon: Building, defaultColor: 'text-indigo-500' },
  center: { icon: Component, defaultColor: 'text-violet-500' },
  department: { icon: FolderTree, defaultColor: 'text-amber-500' },
  team: { icon: Users, defaultColor: 'text-emerald-500' },
  GROUP: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  COMPANY: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  BRANCH: { icon: Building, defaultColor: 'text-indigo-500' },
  CENTER: { icon: Component, defaultColor: 'text-violet-500' },
  DEPARTMENT: { icon: FolderTree, defaultColor: 'text-amber-500' },
  TEAM: { icon: Users, defaultColor: 'text-emerald-500' },
  USER: { icon: UserCircle, defaultColor: 'text-slate-500' }
}

function normalizeOrgType(type: string): OrgType {
  return type.toLowerCase() as OrgType
}

/** 根据上级组织类型，返回可创建的下级类型 */
export function allowedChildTypes(parentType: string): OrgType[] {
  const normalized = normalizeOrgType(parentType)
  if (normalized === ORG_TYPES.GROUP) return [ORG_TYPES.COMPANY, ORG_TYPES.CENTER]
  if (normalized === ORG_TYPES.COMPANY) return [ORG_TYPES.BRANCH, ORG_TYPES.CENTER]
  if (normalized === ORG_TYPES.BRANCH) return [ORG_TYPES.CENTER, ORG_TYPES.DEPARTMENT]
  if (normalized === ORG_TYPES.CENTER) return [ORG_TYPES.DEPARTMENT, ORG_TYPES.TEAM]
  if (normalized === ORG_TYPES.DEPARTMENT) return [ORG_TYPES.TEAM]
  return []
}

export function canOrganizationBeChildOf(childType: string, parentType: string): boolean {
  return allowedChildTypes(parentType).includes(normalizeOrgType(childType))
}

export function formatAllowedParentTypeLabels(childType: string): string {
  const normalized = normalizeOrgType(childType)
  const parentTypes = (Object.values(ORG_TYPES) as OrgType[]).filter((parentType) =>
    allowedChildTypes(parentType).includes(normalized)
  )
  return parentTypes.map((type) => organizationTypeLabels[type]).join('、')
}

export function getOrganizationTypeLabel(type: string): string {
  return organizationTypeLabels[type] ?? organizationTypeLabels[normalizeOrgType(type)] ?? type
}

export function canBeRootOrganization(type: string): boolean {
  return ROOT_ORGANIZATION_TYPES.includes(normalizeOrgType(type))
}
