import type { UserGender, UserStatus } from '@zen/shared'

interface StatusConfig {
  label: string
  className: string
}

export const statusAvatarBadgeClassName: Record<UserStatus, string> = {
  active: 'bg-green-600 dark:bg-green-500',
  inactive: 'bg-zinc-400 dark:bg-zinc-500',
  pending: 'bg-sky-600 dark:bg-sky-500',
  suspended: 'bg-destructive'
}

export const statusConfig: Record<UserStatus, StatusConfig> = {
  active: {
    label: '已激活',
    className:
      'border-green-700/20 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950 dark:text-green-300'
  },
  inactive: {
    label: '未激活',
    className:
      'border-zinc-500/20 bg-zinc-50 text-zinc-600 dark:border-zinc-500/60 dark:bg-zinc-900 dark:text-zinc-300'
  },
  pending: {
    label: '待审核',
    className:
      'border-sky-700/20 bg-sky-50 text-sky-700 dark:border-sky-700/60 dark:bg-sky-950 dark:text-sky-300'
  },
  suspended: {
    label: '已停用',
    className:
      'border-red-700/20 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950 dark:text-red-300'
  }
}

export const statusOptions = (Object.entries(statusConfig) as [UserStatus, StatusConfig][]).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
)

export const genderLabels: Record<UserGender, string> = {
  male: '男',
  female: '女',
  unknown: '未知'
}

export const genderOptions = (Object.entries(genderLabels) as [UserGender, string][]).map(
  ([value, label]) => ({ value, label })
)

export const organizationTypeLabels: Record<string, string> = {
  group: '集团',
  company: '公司',
  branch: '分公司',
  center: '中心',
  department: '部门',
  team: '小组'
}
