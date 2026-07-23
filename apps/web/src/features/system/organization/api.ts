import { request } from '@/lib/request'

import type {
  CreateOrganization,
  CreatePost,
  DeleteOrganizations,
  MoveOrganization,
  Organization,
  OrganizationTreeNode,
  UpdateOrganization,
  UpdatePost,
  UpsertOrganizationMember
} from '@zen/shared'

export interface OrganizationMember {
  userId: string
  username: string
  nickname: string | null
  email: string
  isPrimary: boolean
  postId: string | null
  postName: string | null
  joinedAt: string | null
}

export interface OrganizationPost {
  id: string
  code: string
  name: string
  organizationId: string
  description: string | null
  status: 'active' | 'disabled'
  sort: number
  createdAt: string
  updatedAt: string
}

export const organizationApi = {
  getTree: () => request.get<OrganizationTreeNode[]>('/organization/tree'),

  getById: (id: string) => request.get<Organization>(`/organization/${id}`),

  create: (data: CreateOrganization) =>
    request.post<Organization, CreateOrganization>('/organization', data),

  update: (id: string, data: UpdateOrganization) =>
    request.patch<Organization, UpdateOrganization>(`/organization/${id}`, data),

  move: (id: string, data: MoveOrganization) =>
    request.patch<Organization, MoveOrganization>(`/organization/${id}/move`, data),

  remove: (payload: DeleteOrganizations) =>
    request.delete<Organization[], DeleteOrganizations>('/organization', { data: payload }),

  listMembers: (organizationId: string) =>
    request.get<OrganizationMember[]>(`/organization/${organizationId}/members`),

  upsertMember: (organizationId: string, data: UpsertOrganizationMember) =>
    request.post<OrganizationMember, UpsertOrganizationMember>(
      `/organization/${organizationId}/members`,
      data
    ),

  removeMember: (organizationId: string, userId: string) =>
    request.delete<void>(`/organization/${organizationId}/members/${userId}`),

  listPosts: (organizationId?: string) =>
    request.get<OrganizationPost[]>('/organization/posts', {
      params: organizationId ? { organizationId } : undefined
    }),

  createPost: (data: CreatePost) =>
    request.post<OrganizationPost, CreatePost>('/organization/posts', data),

  updatePost: (postId: string, data: UpdatePost) =>
    request.patch<OrganizationPost, UpdatePost>(`/organization/posts/${postId}`, data),

  deletePost: (postId: string) => request.delete<void>(`/organization/posts/${postId}`)
}
