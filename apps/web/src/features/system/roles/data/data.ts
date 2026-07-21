import { Database, FolderTree, ShieldCheck, UserRound } from 'lucide-react'

import type { RoleDataScope, RoleStatus } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'

interface StatusConfig {
  label: string
  color: string
}

interface DataScopeConfig {
  label: string
  icon: LucideIcon
}

export const roleStatusConfig: Record<RoleStatus, StatusConfig> = {
  active: {
    label: '启用',
    color: 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'
  },
  disabled: {
    label: '禁用',
    color:
      'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'
  }
}

export const dataScopeConfig: Record<RoleDataScope, DataScopeConfig> = {
  all: {
    label: '全部数据',
    icon: Database
  },
  department: {
    label: '本部门及以下',
    icon: FolderTree
  },
  self: {
    label: '仅本人',
    icon: UserRound
  },
  custom: {
    label: '自定义',
    icon: ShieldCheck
  }
}

export const dataScopeOptions = Object.entries(dataScopeConfig).map(([value, config]) => ({
  value,
  label: config.label
}))

export const roleStatusOptions = Object.entries(roleStatusConfig).map(([value, config]) => ({
  value,
  label: config.label
}))
