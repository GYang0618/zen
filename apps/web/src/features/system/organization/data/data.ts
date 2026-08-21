import {
  allowedChildTypes,
  canBeChildOf,
  canBeRootOrganization,
  formatAllowedParentTypeLabels,
  getOrganizationTypeLabel,
  ORGANIZATION_TYPE_LABELS,
  ROOT_ORGANIZATION_TYPES
} from '@zen/shared'
import {
  Building,
  Building2,
  Component,
  FolderKanban,
  FolderTree,
  Layers,
  Network,
  UserCircle,
  Users
} from 'lucide-react'

import type { OrganizationType } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'

export const ORG_TYPES = {
  GROUP: 'group',
  COMPANY: 'company',
  DIVISION: 'division',
  BRANCH: 'branch',
  CENTER: 'center',
  DEPARTMENT: 'department',
  TEAM: 'team',
  PROJECT: 'project'
} as const satisfies Record<string, OrganizationType>

export type OrgType = (typeof ORG_TYPES)[keyof typeof ORG_TYPES]

export { allowedChildTypes, ROOT_ORGANIZATION_TYPES }

export const organizationTypeLabels: Record<string, string> = {
  ...ORGANIZATION_TYPE_LABELS,
  GROUP: ORGANIZATION_TYPE_LABELS.group,
  COMPANY: ORGANIZATION_TYPE_LABELS.company,
  DIVISION: ORGANIZATION_TYPE_LABELS.division,
  BRANCH: ORGANIZATION_TYPE_LABELS.branch,
  CENTER: ORGANIZATION_TYPE_LABELS.center,
  DEPARTMENT: ORGANIZATION_TYPE_LABELS.department,
  TEAM: ORGANIZATION_TYPE_LABELS.team,
  PROJECT: ORGANIZATION_TYPE_LABELS.project
}

export const organizationIconConfig: Record<string, { icon: LucideIcon; defaultColor: string }> = {
  group: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  company: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  division: { icon: Layers, defaultColor: 'text-cyan-600 dark:text-cyan-400' },
  branch: { icon: Building, defaultColor: 'text-indigo-500' },
  center: { icon: Component, defaultColor: 'text-violet-500' },
  department: { icon: FolderTree, defaultColor: 'text-amber-500' },
  team: { icon: Users, defaultColor: 'text-emerald-500' },
  project: { icon: FolderKanban, defaultColor: 'text-orange-500' },
  GROUP: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  COMPANY: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  DIVISION: { icon: Layers, defaultColor: 'text-cyan-600 dark:text-cyan-400' },
  BRANCH: { icon: Building, defaultColor: 'text-indigo-500' },
  CENTER: { icon: Component, defaultColor: 'text-violet-500' },
  DEPARTMENT: { icon: FolderTree, defaultColor: 'text-amber-500' },
  TEAM: { icon: Users, defaultColor: 'text-emerald-500' },
  PROJECT: { icon: FolderKanban, defaultColor: 'text-orange-500' },
  USER: { icon: UserCircle, defaultColor: 'text-slate-500' }
}

export function canOrganizationBeChildOf(childType: string, parentType: string): boolean {
  return canBeChildOf(childType, parentType)
}

export { canBeRootOrganization, formatAllowedParentTypeLabels, getOrganizationTypeLabel }
