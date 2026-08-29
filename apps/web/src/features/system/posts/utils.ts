import type { JobProfileStatus } from '@zen/shared'

export const JOB_PROFILE_LEVEL_OPTIONS = [
  { value: 'P5', label: 'P5 / 中级' },
  { value: 'P6', label: 'P6 / 资深' },
  { value: 'P7', label: 'P7 / 专家' },
  { value: 'P8', label: 'P8 / 总监' }
] as const

export const JOB_PROFILE_STATUS_OPTIONS = [
  { value: 'active', label: '启用' },
  { value: 'disabled', label: '停用' }
] as const

export const jobProfileStatusConfig = {
  active: {
    label: '启用',
    className: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
  },
  disabled: {
    label: '停用',
    className: 'border-muted-foreground/30'
  }
} as const

export function formatJobProfileLevel(level: string): string {
  const matched = JOB_PROFILE_LEVEL_OPTIONS.find(
    (item) => item.value === level || level.startsWith(item.value)
  )
  return matched?.label ?? level
}

export function formatJobProfileStatus(status: string): string {
  return JOB_PROFILE_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
}

export function isJobProfileDeletable(item: { organizationCount: number }): boolean {
  return item.organizationCount === 0
}

export function getDeletableJobProfiles<T extends { organizationCount: number }>(items: T[]): T[] {
  return items.filter(isJobProfileDeletable)
}

export function getJobProfilesForStatusChange<T extends { status: JobProfileStatus }>(
  items: T[],
  status: JobProfileStatus
): T[] {
  return items.filter((item) => item.status !== status)
}
