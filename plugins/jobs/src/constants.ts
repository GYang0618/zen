export const JOB_PERMISSIONS = {
  LIST: 'job:task:list',
  MANAGE: 'job:task:manage'
} as const

export const JOB_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export const JOBS_PLUGIN_ID = 'jobs'
