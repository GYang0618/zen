import { request } from '@/lib/request'

import type {
  AddOrganizationMember,
  ChangeOrganizationParent,
  CreateOrganization,
  CreatePosition,
  Organization,
  OrganizationActivitiesQuery,
  OrganizationActivity,
  OrganizationMember,
  OrganizationTreeNode,
  Paged,
  Position,
  UpdateOrganization,
  UpdateOrganizationLeader
} from '@zen/shared'

export const organizationApi = {
  getTree: () => request.get<OrganizationTreeNode[]>('/organizations/tree'),

  getById: (id: string) => request.get<Organization>(`/organizations/${id}`),

  create: (data: CreateOrganization) =>
    request.post<Organization, CreateOrganization>('/organizations', data),

  update: (id: string, data: UpdateOrganization) =>
    request.patch<Organization, UpdateOrganization>(`/organizations/${id}`, data),

  updateLeader: (id: string, data: UpdateOrganizationLeader) =>
    request.patch<Organization, UpdateOrganizationLeader>(`/organizations/${id}/leader`, data),

  changeParent: (id: string, data: ChangeOrganizationParent) =>
    request.patch<Organization, ChangeOrganizationParent>(`/organizations/${id}/parent`, data),

  listMembers: (id: string) => request.get<OrganizationMember[]>(`/organizations/${id}/members`),

  addMember: (id: string, data: AddOrganizationMember) =>
    request.post<OrganizationMember[], AddOrganizationMember>(`/organizations/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    request.delete<void>(`/organizations/${id}/members/${userId}`),

  listPositions: (id: string) => request.get<Position[]>(`/organizations/${id}/positions`),

  createPosition: (id: string, data: CreatePosition) =>
    request.post<Position, CreatePosition>(`/organizations/${id}/positions`, data),

  listActivities: (id: string, params?: OrganizationActivitiesQuery) =>
    request.get<Paged<OrganizationActivity>>(`/organizations/${id}/activities`, { params })
}
