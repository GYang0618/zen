import { Database, FolderTree, ShieldCheck, UserRound } from 'lucide-react'

import type { RoleDataScope, UserStatus } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'

interface StatusConfig {
  label: string
  color: string
}

interface DataScopeConfig {
  label: string
  icon: LucideIcon
}

export const roleStatusConfig: Record<UserStatus, StatusConfig> = {
  active: {
    label: '启用',
    color: 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'
  },
  inactive: {
    label: '停用',
    color: 'bg-neutral-300/40 border-neutral-300'
  },
  pending: {
    label: '待审核',
    color: 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'
  },
  suspended: {
    label: '已冻结',
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
