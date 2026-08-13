import { ROLE_ICON_COLOR_VALUES, ROLE_ICON_VALUES } from '@zen/shared'
import { Building2, Database, FolderTree, ShieldCheck, UserRound } from 'lucide-react'

import type { RoleDataScope, RoleEffectiveStatus, RoleIconColor } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'

export const ROLE_ICONS = ROLE_ICON_VALUES
export type RoleIconName = (typeof ROLE_ICONS)[number]

export const ROLE_ICON_COLORS = [
  {
    value: 'slate' as const,
    label: '石板灰',
    swatchClassName: 'bg-slate-500',
    className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
  },
  {
    value: 'sky' as const,
    label: '天蓝',
    swatchClassName: 'bg-sky-500',
    className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
  },
  {
    value: 'teal' as const,
    label: '青绿',
    swatchClassName: 'bg-teal-500',
    className: 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
  },
  {
    value: 'emerald' as const,
    label: '翠绿',
    swatchClassName: 'bg-emerald-500',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  {
    value: 'amber' as const,
    label: '琥珀',
    swatchClassName: 'bg-amber-500',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  },
  {
    value: 'orange' as const,
    label: '橙色',
    swatchClassName: 'bg-orange-500',
    className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
  },
  {
    value: 'rose' as const,
    label: '玫红',
    swatchClassName: 'bg-rose-500',
    className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  },
  {
    value: 'indigo' as const,
    label: '靛蓝',
    swatchClassName: 'bg-indigo-500',
    className: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
  }
] as const satisfies ReadonlyArray<{
  value: RoleIconColor
  label: string
  swatchClassName: string
  className: string
}>

export { ROLE_ICON_COLOR_VALUES }

export const roleIconColorConfig = Object.fromEntries(
  ROLE_ICON_COLORS.map((color) => [color.value, color])
) as Record<RoleIconColor, (typeof ROLE_ICON_COLORS)[number]>

export function getRoleIconColorClassName(color: RoleIconColor | null | undefined): string {
  if (!color) return 'bg-muted-foreground/15 text-muted-foreground'
  return roleIconColorConfig[color]?.className ?? 'bg-muted-foreground/15 text-muted-foreground'
}

interface StatusConfig {
  label: string
  className: string
}

export const roleEffectiveStatusConfig: Record<RoleEffectiveStatus, StatusConfig> = {
  active: {
    label: '已激活',
    className:
      'border-green-700/20 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950 dark:text-green-300'
  },
  disabled: {
    label: '已冻结',
    className:
      'border-amber-700/20 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950 dark:text-amber-300'
  },
  expired: {
    label: '已过期',
    className:
      'border-red-700/20 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950 dark:text-red-300'
  },
  locked: {
    label: '已锁定',
    className:
      'border-zinc-500/20 bg-zinc-50 text-zinc-600 dark:border-zinc-500/60 dark:bg-zinc-900 dark:text-zinc-300'
  }
}

export const roleEffectiveStatusOptions = (
  Object.entries(roleEffectiveStatusConfig) as [RoleEffectiveStatus, StatusConfig][]
).map(([value, config]) => ({
  value,
  label: config.label
}))

interface DataScopeConfig {
  label: string
  description: string
  icon: LucideIcon
}

export const dataScopeConfig: Record<RoleDataScope, DataScopeConfig> = {
  all: {
    label: '全部数据',
    description: '无任何隔离过滤，可访问全局跨组织全量行级数据',
    icon: Database
  },
  org_and_child: {
    label: '本组织及下级',
    description: '适用于组织负责人，能够穿透下级组织',
    icon: FolderTree
  },
  org: {
    label: '仅本组织',
    description: '只能查看当前绑定组织的数据，无法穿透子组织',
    icon: Building2
  },
  self: {
    label: '仅本人数据',
    description: '最高安全隔离级别，严格限定数据归属人为自己',
    icon: UserRound
  },
  custom: {
    label: '自定义组织白名单',
    description: '仅可访问手动勾选的组织节点数据',
    icon: ShieldCheck
  }
}

export const dataScopeOptions = (
  Object.entries(dataScopeConfig) as [RoleDataScope, DataScopeConfig][]
).map(([value, config]) => ({
  value,
  label: config.label,
  description: config.description,
  icon: config.icon
}))
