import { Building2, Database, FolderTree, ShieldCheck, UserRound } from 'lucide-react'

import type { RoleDataScope, RoleStatus } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'

interface StatusConfig {
  label: string
  color: string
}

interface DataScopeConfig {
  label: string
  description: string
  icon: LucideIcon
}

export const roleStatusConfig: Record<RoleStatus, StatusConfig> = {
  active: {
    label: '正常调度',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  disabled: {
    label: '受限冻结',
    color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
  }
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

export const roleStatusOptions = Object.entries(roleStatusConfig).map(([value, config]) => ({
  value,
  label: config.label
}))
