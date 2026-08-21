import { request } from '@/lib/request'

import type {
  AddOrganizationMember,
  ChangeOrganizationParent,
  CreateOrganization,
  LinkOrganizationPosition,
  Organization,
  OrganizationActivitiesQuery,
  OrganizationActivity,
  OrganizationMember,
  OrganizationTreeNode,
  OrganizationTypeCatalogResponse,
  Paged,
  Position,
  UpdateOrganization,
  UpdateOrganizationLeader,
  UpdateOrganizationPosition,
  UpdateOrganizationTypeCatalog
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

  createPosition: (id: string, data: LinkOrganizationPosition) =>
    request.post<Position, LinkOrganizationPosition>(`/organizations/${id}/positions`, data),

  updatePosition: (id: string, positionId: string, data: UpdateOrganizationPosition) =>
    request.patch<Position, UpdateOrganizationPosition>(
      `/organizations/${id}/positions/${positionId}`,
      data
    ),

  removePosition: (id: string, positionId: string) =>
    request.delete<void>(`/organizations/${id}/positions/${positionId}`),

  listActivities: (id: string, params?: OrganizationActivitiesQuery) =>
    request.get<Paged<OrganizationActivity>>(`/organizations/${id}/activities`, { params }),

  getTypeCatalog: () => request.get<OrganizationTypeCatalogResponse>('/organizations/type-catalog'),

  updateTypeCatalog: (data: UpdateOrganizationTypeCatalog) =>
    request.patch<OrganizationTypeCatalogResponse, UpdateOrganizationTypeCatalog>(
      '/organizations/type-catalog',
      data
    )
}
