import { JOB_PROFILE_ICON_COLOR_VALUES, JOB_PROFILE_ICON_VALUES } from '@zen/shared'

import type { JobProfileIcon, JobProfileIconColor } from '@zen/shared'

export const JOB_PROFILE_ICONS = [
  { value: 'briefcase-business', label: '通用岗位' },
  { value: 'code-2', label: '研发工程' },
  { value: 'palette', label: '设计创意' },
  { value: 'chart-no-axes-combined', label: '数据分析' },
  { value: 'megaphone', label: '市场营销' },
  { value: 'badge-dollar-sign', label: '销售商务' },
  { value: 'headset', label: '客户服务' },
  { value: 'users', label: '人力资源' },
  { value: 'scale', label: '法务合规' },
  { value: 'calculator', label: '财务会计' },
  { value: 'stethoscope', label: '医疗健康' },
  { value: 'graduation-cap', label: '教育培训' },
  { value: 'wrench', label: '技术维护' },
  { value: 'factory', label: '生产制造' },
  { value: 'truck', label: '物流运输' },
  { value: 'shopping-cart', label: '零售电商' },
  { value: 'building-2', label: '行政管理' },
  { value: 'shield-check', label: '安全风控' },
  { value: 'flask-conical', label: '研究实验' },
  { value: 'clipboard-check', label: '运营管理' },
  { value: 'chef-hat', label: '餐饮服务' },
  { value: 'plane', label: '航空旅行' },
  { value: 'leaf', label: '环保农业' },
  { value: 'hard-hat', label: '工程建设' }
] as const satisfies ReadonlyArray<{ value: JobProfileIcon; label: string }>

const configuredIconValues = JOB_PROFILE_ICONS.map((item) => item.value)
if (
  configuredIconValues.length !== JOB_PROFILE_ICON_VALUES.length ||
  JOB_PROFILE_ICON_VALUES.some((value) => !configuredIconValues.includes(value))
) {
  throw new Error('岗位图标配置与共享协议不一致')
}

export const JOB_PROFILE_ICON_COLORS = [
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
  value: JobProfileIconColor
  label: string
  swatchClassName: string
  className: string
}>

const configuredColorValues = JOB_PROFILE_ICON_COLORS.map((item) => item.value)
if (
  configuredColorValues.length !== JOB_PROFILE_ICON_COLOR_VALUES.length ||
  JOB_PROFILE_ICON_COLOR_VALUES.some((value) => !configuredColorValues.includes(value))
) {
  throw new Error('岗位图标颜色配置与共享协议不一致')
}

const iconColorConfig = Object.fromEntries(
  JOB_PROFILE_ICON_COLORS.map((color) => [color.value, color])
) as Record<JobProfileIconColor, (typeof JOB_PROFILE_ICON_COLORS)[number]>

export function getJobProfileIconColorClassName(
  color: JobProfileIconColor | null | undefined
): string {
  if (!color) return 'bg-muted-foreground/15 text-muted-foreground'
  return iconColorConfig[color]?.className ?? 'bg-muted-foreground/15 text-muted-foreground'
}
