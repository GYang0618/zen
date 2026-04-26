import { Shield, UserCheck, Users } from 'lucide-react'

import type { UserStatus } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'

interface StatusConfig {
  label: string
  color: string
}

interface RoleConfig {
  label: string
  icon?: LucideIcon
}

export const statusConfig: Record<UserStatus, StatusConfig> = {
  active: {
    label: '激活',
    color: 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'
  },
  inactive: {
    label: '未激活',
    color: 'bg-neutral-300/40 border-neutral-300'
  },
  pending: {
    label: '待审核',
    color: 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'
  },
  suspended: {
    label: '已停用',
    color:
      'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'
  }
} as const

const fallbackRole: RoleConfig = { label: '—', icon: Users }

export const roleConfig: Record<string, RoleConfig> = {
  super_admin: {
    label: '超级管理员',
    icon: Shield
  },
  admin: {
    label: '管理员',
    icon: UserCheck
  },
  guest: {
    label: '访客',
    icon: Users
  }
}

export function getRoleDisplay(role: string | null): RoleConfig {
  if (!role) return fallbackRole
  return roleConfig[role] ?? { label: role, icon: Users }
}
