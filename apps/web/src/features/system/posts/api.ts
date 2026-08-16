import { request } from '@/lib/request'

import type {
  CreateJobProfile,
  FindJobProfilesQuery,
  JobProfile,
  JobProfileDetail,
  LinkOrganizationPosition,
  Position,
  UpdateJobProfile,
  UpdateOrganizationPosition
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const postApi = {
  getList: (params?: FindJobProfilesQuery) =>
    request.get<PaginationResponse<JobProfile>>('/posts', { params }),

  getById: (id: string) => request.get<JobProfileDetail>(`/posts/${id}`),

  create: (data: CreateJobProfile) => request.post<JobProfile, CreateJobProfile>('/posts', data),

  update: (id: string, data: UpdateJobProfile) =>
    request.patch<JobProfile, UpdateJobProfile>(`/posts/${id}`, data),

  disable: (id: string) =>
    request.patch<JobProfile, UpdateJobProfile>(`/posts/${id}`, { status: 'disabled' }),

  remove: (id: string) => request.delete<void>(`/posts/${id}`)
}

export type {
  CreateJobProfile,
  FindJobProfilesQuery,
  JobProfile,
  JobProfileDetail,
  LinkOrganizationPosition,
  Position,
  UpdateJobProfile,
  UpdateOrganizationPosition
}
