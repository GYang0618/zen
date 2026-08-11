import type { IconName } from 'lucide-react/dynamic'
import type { Role, RoleIconColor } from '../type'

/** 适合作为角色标识的 Lucide 精选图标集 */
export const ROLE_ICONS = [
  'crown',
  'shield',
  'shield-check',
  'shield-user',
  'user-shield',
  'lock',
  'key-round',
  'fingerprint',
  'badge-check',
  'users',
  'user-round',
  'user-cog',
  'user-check',
  'id-card',
  'briefcase',
  'building-2',
  'settings',
  'eye',
  'database',
  'server',
  'clipboard-check',
  'gavel',
  'scale',
  'hard-hat',
  'wrench',
  'headphones',
  'wallet',
  'book-user',
  'star',
  'contact'
] as const satisfies readonly IconName[]

export type RoleIconName = (typeof ROLE_ICONS)[number]

/** 角色图标配色：低饱和背景 + 清晰前景，深浅色均可读 */
export const ROLE_ICON_COLORS = [
  {
    value: 'slate',
    label: '石板灰',
    swatchClassName: 'bg-slate-500',
    className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
  },
  {
    value: 'sky',
    label: '天蓝',
    swatchClassName: 'bg-sky-500',
    className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
  },
  {
    value: 'teal',
    label: '青绿',
    swatchClassName: 'bg-teal-500',
    className: 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
  },
  {
    value: 'emerald',
    label: '翠绿',
    swatchClassName: 'bg-emerald-500',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  {
    value: 'amber',
    label: '琥珀',
    swatchClassName: 'bg-amber-500',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  },
  {
    value: 'orange',
    label: '橙色',
    swatchClassName: 'bg-orange-500',
    className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
  },
  {
    value: 'rose',
    label: '玫红',
    swatchClassName: 'bg-rose-500',
    className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  },
  {
    value: 'indigo',
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

export const ROLE_ICON_COLOR_VALUES = ROLE_ICON_COLORS.map(
  (color) => color.value
) as unknown as [RoleIconColor, ...RoleIconColor[]]

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

export const roleStatusConfig: Record<Role['status'], StatusConfig> = {
  active: {
    label: '已激活',
    className:
      'border-green-700/20 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950 dark:text-green-300'
  },
  inactive: {
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

export const roleStatusOptions = (
  Object.entries(roleStatusConfig) as [Role['status'], StatusConfig][]
).map(([value, config]) => ({
  value,
  label: config.label
}))
