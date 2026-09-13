import { request } from '@/lib/request'

import type {
  AddOrganizationMember,
  BatchTransferMembers,
  ChangeOrganizationParent,
  CreateOrganization,
  DissolveOrganization,
  FindOrganizationsQuery,
  LinkOrganizationPosition,
  MergeOrganization,
  Organization,
  OrganizationActivitiesQuery,
  OrganizationActivity,
  OrganizationMember,
  OrganizationTreeNode,
  OrganizationTreeQuery,
  OrganizationTypeCatalogResponse,
  Paged,
  Position,
  UpdateOrganization,
  UpdateOrganizationLeader,
  UpdateOrganizationPosition,
  UpdateOrganizationTypeCatalog,
  UpdatePositionRoles
} from '@zen/shared'

export const organizationApi = {
  getTree: (params?: OrganizationTreeQuery) =>
    request.get<OrganizationTreeNode[]>('/organizations/tree', { params }),

  list: (params?: FindOrganizationsQuery) =>
    request.get<Paged<Organization>>('/organizations', { params }),

  getById: (id: string) => request.get<Organization>(`/organizations/${id}`),

  create: (data: CreateOrganization) =>
    request.post<Organization, CreateOrganization>('/organizations', data),

  update: (id: string, data: UpdateOrganization) =>
    request.patch<Organization, UpdateOrganization>(`/organizations/${id}`, data),

  remove: (id: string) => request.delete<void>(`/organizations/${id}`),

  dissolve: (id: string, data: DissolveOrganization) =>
    request.post<void, DissolveOrganization>(`/organizations/${id}/dissolve`, data),

  merge: (id: string, data: MergeOrganization) =>
    request.post<void, MergeOrganization>(`/organizations/${id}/merge`, data),

  updateLeader: (id: string, data: UpdateOrganizationLeader) =>
    request.patch<Organization, UpdateOrganizationLeader>(`/organizations/${id}/leader`, data),

  changeParent: (id: string, data: ChangeOrganizationParent) =>
    request.patch<Organization, ChangeOrganizationParent>(`/organizations/${id}/parent`, data),

  listMembers: (id: string) => request.get<OrganizationMember[]>(`/organizations/${id}/members`),

  addMember: (id: string, data: AddOrganizationMember) =>
    request.post<OrganizationMember[], AddOrganizationMember>(`/organizations/${id}/members`, data),

  batchTransferMembers: (id: string, data: BatchTransferMembers) =>
    request.post<void, BatchTransferMembers>(`/organizations/${id}/members/batch-transfer`, data),

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

  updatePositionRoles: (id: string, positionId: string, data: UpdatePositionRoles) =>
    request.patch<Position, UpdatePositionRoles>(
      `/organizations/${id}/positions/${positionId}/roles`,
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
