import type { IconName } from 'lucide-react/dynamic'
import type { Role } from '../type'

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
