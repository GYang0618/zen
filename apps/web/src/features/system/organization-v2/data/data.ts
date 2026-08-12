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

export const ORG_TYPES = {
  GROUP: 'GROUP',
  COMPANY: 'COMPANY',
  BRANCH: 'BRANCH',
  CENTER: 'CENTER',
  DEPARTMENT: 'DEPARTMENT',
  TEAM: 'TEAM'
} as const

export type OrgType = (typeof ORG_TYPES)[keyof typeof ORG_TYPES]

/** 未选择上级组织时（新建为根节点）允许创建的组织类型 */
export const ROOT_ORGANIZATION_TYPES: OrgType[] = [
  ORG_TYPES.GROUP,
  ORG_TYPES.COMPANY,
  ORG_TYPES.CENTER
]

export const organizationTypeLabels: Record<string, string> = {
  GROUP: '集团',
  COMPANY: '公司',
  BRANCH: '分公司',
  CENTER: '中心',
  DEPARTMENT: '部门',
  TEAM: '小组'
}

export const organizationIconConfig: Record<string, { icon: LucideIcon; defaultColor: string }> = {
  GROUP: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  COMPANY: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  BRANCH: { icon: Building, defaultColor: 'text-indigo-500' },
  CENTER: { icon: Component, defaultColor: 'text-violet-500' },
  DEPARTMENT: { icon: FolderTree, defaultColor: 'text-amber-500' },
  TEAM: { icon: Users, defaultColor: 'text-emerald-500' },
  USER: { icon: UserCircle, defaultColor: 'text-slate-500' }
} as const

/** 根据上级组织类型，返回可创建的下级类型（岗位由组织详情统一关联，不作为组织类型） */
export function allowedChildTypes(parentType: string): OrgType[] {
  const normalized = parentType.toUpperCase()
  if (normalized === ORG_TYPES.GROUP) return [ORG_TYPES.COMPANY, ORG_TYPES.CENTER]
  if (normalized === ORG_TYPES.COMPANY) return [ORG_TYPES.BRANCH, ORG_TYPES.CENTER]
  if (normalized === ORG_TYPES.BRANCH) return [ORG_TYPES.CENTER, ORG_TYPES.DEPARTMENT]
  if (normalized === ORG_TYPES.CENTER) return [ORG_TYPES.DEPARTMENT, ORG_TYPES.TEAM]
  if (normalized === ORG_TYPES.DEPARTMENT) return [ORG_TYPES.TEAM]
  return []
}

/** 判断某组织类型能否作为目标父节点的直接子节点 */
export function canOrganizationBeChildOf(childType: string, parentType: string): boolean {
  return allowedChildTypes(parentType).includes(childType.toUpperCase() as OrgType)
}

/** 返回可作为某类型上级的组织类型文案，用于拖拽失败提示 */
export function formatAllowedParentTypeLabels(childType: string): string {
  const normalized = childType.toUpperCase()
  const parentTypes = (Object.values(ORG_TYPES) as OrgType[]).filter((parentType) =>
    allowedChildTypes(parentType).includes(normalized as OrgType)
  )
  return parentTypes.map((type) => organizationTypeLabels[type]).join('、')
}

export function getOrganizationTypeLabel(type: string): string {
  return organizationTypeLabels[type] ?? type
}
