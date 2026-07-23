import { JOB_PERMISSIONS } from '../constants'

import type { JobDto } from '../job.schema'

export type JobsRequest = {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, body?: unknown) => Promise<T>
}

export function createJobsApi(request: JobsRequest) {
  return {
    list: () => request.get<JobDto[]>('/jobs'),
    get: (id: string) => request.get<JobDto>(`/jobs/${id}`),
    create: (body: { name: string; payload?: unknown }) => request.post<JobDto>('/jobs', body)
  }
}

export { JOB_PERMISSIONS }
